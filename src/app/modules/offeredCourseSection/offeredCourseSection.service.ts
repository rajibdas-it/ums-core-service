/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { offeredCourseClassScheduleUtils } from './../offeredCourseClassSchedule/offeredCourseClassSchedule.utils';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OfferedCourseSection } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { asyncForEach } from '../../../shared/asyncForLoop';
import prisma from '../../../shared/prisma';

const createOfferedCourseSection = async (
  payload: any,
): Promise<OfferedCourseSection | null> => {
  const { classSchedules, ...data } = payload;
  const isExistOfferedCourse = await prisma.offeredCourse.findFirst({
    where: { id: data.offeredCourseId },
  });
  if (!isExistOfferedCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Offered course not found');
  }

  data.semesterRegistrationId = isExistOfferedCourse.semesterRegistrationId;

  await asyncForEach(classSchedules, async (schedule: any) => {
    await offeredCourseClassScheduleUtils.checkRoomAvailable(schedule);
    await offeredCourseClassScheduleUtils.checkFacultyAvailable(schedule);
  });

  const offeredCourseSectionData = await prisma.offeredCourseSection.findFirst({
    where: {
      offeredCourse: {
        id: data.offeredCourseId,
      },
      title: data.title,
    },
  });

  if (offeredCourseSectionData) {
    throw new ApiError(httpStatus.CONFLICT, 'course section already exist');
  }
  const createSection = await prisma.$transaction(async ts => {
    const createOfferedCourseSection = await ts.offeredCourseSection.create({
      data,
    });
    const scheduleData = classSchedules.map((schedule: any) => ({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      dayOfWeek: schedule.dayOfWeek,
      roomId: schedule.roomId,
      facultyId: schedule.facultyId,
      offeredCourseSectionId: createOfferedCourseSection.id,
      semesterRegistrationId: isExistOfferedCourse.semesterRegistrationId,
    }));

    const createSchedule = await ts.offeredCourseClassSchedule.createMany({
      data: scheduleData,
    });

    return createOfferedCourseSection;
  });

  const result = await prisma.offeredCourseSection.findFirst({
    where: {
      id: createSection.id,
    },
    include: {
      offeredCourse: {
        include: {
          course: true,
        },
      },
      offeredCourseClassSchedules: {
        include: {
          faculty: true,
          room: {
            include: { buildings: true },
          },
        },
      },
    },
  });
  return result;
};

export const offeredCourseSectionService = {
  createOfferedCourseSection,
};
