/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Course,
  OfferedCourse,
  Prisma,
  SemesterRegistration,
  SemesterRegistrationStatus,
  StudentErolledCourseStatus,
  StudentSemesterRegistration,
} from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import calculatePagination from '../../../helper/calculatePagination';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { asyncForEach } from '../../../shared/asyncForLoop';
import prisma from '../../../shared/prisma';
import { studentEnrolledCourseMarkService } from '../studentEnrolledCourseMark/studentEnrolledMark.service';
import { studentSemesterPaymentService } from '../studentSemesterPayments/studentSemesterPayment.service';
import { semesterRegistrationUtils } from './semesterRagistration.utils';
import { semesterRegistrationSearchableFields } from './semesterRegistration.constant';
import {
  IEnrollCoursePayload,
  ISemesterFilters,
} from './semesterRegistration.interface';

const createSemesterRegistration = async (
  data: SemesterRegistration,
): Promise<SemesterRegistration> => {
  const isAnySemesterRegRunning = await prisma.semesterRegistration.findFirst({
    where: {
      OR: [
        {
          status: SemesterRegistrationStatus.UPCOMING,
        },
        {
          status: SemesterRegistrationStatus.ONGOING,
        },
      ],
    },
  });
  if (isAnySemesterRegRunning) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `There is already an ${isAnySemesterRegRunning.status}`,
    );
  }
  const result = await prisma.semesterRegistration.create({ data });
  return result;
};

const getAllSemesterRegistration = async (
  options: IPaginationOptions,
  filter: ISemesterFilters,
) => {
  const { skip, limit, page, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, ...filtersData } = filter;

  const andCondition = [];

  if (searchTerm) {
    andCondition.push({
      OR: semesterRegistrationSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (filtersData && Object.keys(filtersData).length > 0) {
    andCondition.push({
      AND: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const whereCondition: Prisma.SemesterRegistrationWhereInput =
    andCondition.length > 0 ? { AND: andCondition } : {};
  const result = await prisma.semesterRegistration.findMany({
    skip,
    take: limit,
    where: whereCondition,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  const total = await prisma.semesterRegistration.count({
    where: whereCondition,
  });
  return { meta: { page, limit, total }, data: result };
};

const getSingleSemesterRegistration = async (
  id: string,
): Promise<SemesterRegistration | null> => {
  const result = await prisma.semesterRegistration.findUnique({
    where: { id },
  });
  return result;
};

const updateSemesterRegistration = async (
  id: string,
  payload: Partial<SemesterRegistration>,
): Promise<SemesterRegistration> => {
  const isExist = await prisma.semesterRegistration.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Semester not found');
  }

  if (
    payload.status &&
    isExist.status === SemesterRegistrationStatus.UPCOMING &&
    payload.status !== SemesterRegistrationStatus.ONGOING
  ) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      'status update from upcoming to ongoing',
    );
  }

  if (
    payload.status &&
    isExist.status === SemesterRegistrationStatus.ONGOING &&
    payload.status !== SemesterRegistrationStatus.ENDED
  ) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      'Status can be update from onging to Ended',
    );
  }
  if (payload.status && isExist.status === SemesterRegistrationStatus.ENDED) {
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      'Semester Registration has already Ended. you cannot update.',
    );
  }

  const result = await prisma.semesterRegistration.update({
    where: { id },
    data: payload,
    include: {
      academicSemester: true,
    },
  });
  return result;
};

const deleteSemesterRegistration = async (id: string) => {
  const result = await prisma.semesterRegistration.delete({
    where: { id },
  });
  return result;
};
const startMyRegistration = async (
  authUserid: string,
): Promise<{
  semesterRegistration: SemesterRegistration | null;
  studentSemesterRegistration: StudentSemesterRegistration | null;
}> => {
  const studentInfo = await prisma.student.findUnique({
    where: { studentId: authUserid },
  });
  if (!studentInfo) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student not found');
  }

  const semesterRegistrationInfo = await prisma.semesterRegistration.findFirst({
    where: {
      status: {
        in: [
          SemesterRegistrationStatus.UPCOMING,
          SemesterRegistrationStatus.ONGOING,
        ],
      },
    },
  });

  if (
    semesterRegistrationInfo?.status === SemesterRegistrationStatus.UPCOMING
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Registration is not started yet',
    );
  }

  let studentRegistration = await prisma.studentSemesterRegistration.findFirst({
    where: {
      student: {
        id: studentInfo?.id,
      },
      semesterRegistration: {
        id: semesterRegistrationInfo?.id,
      },
    },
  });

  if (!studentRegistration) {
    studentRegistration = await prisma.studentSemesterRegistration.create({
      data: {
        student: {
          connect: {
            id: studentInfo?.id,
          },
        },
        semesterRegistration: {
          connect: {
            id: semesterRegistrationInfo?.id,
          },
        },
      },
    });
  }

  return {
    semesterRegistration: semesterRegistrationInfo,
    studentSemesterRegistration: studentRegistration,
  };
};

const enrollIntoCourse = async (
  authId: string,
  payload: IEnrollCoursePayload,
) => {
  const student = await prisma.student.findUnique({
    where: {
      studentId: authId,
    },
  });

  const semesterRegistration = await prisma.semesterRegistration.findFirst({
    where: {
      status: SemesterRegistrationStatus.ONGOING,
    },
  });

  const offeredCourse = await prisma.offeredCourse.findFirst({
    where: { id: payload.offeredCourseId },
    include: { course: true },
  });
  const offeredCourseSection = await prisma.offeredCourseSection.findFirst({
    where: { id: payload.offeredCourseSectionId },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (!semesterRegistration) {
    throw new ApiError(httpStatus.NOT_FOUND, 'semester registration not found');
  }

  if (!offeredCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Offered Course not found');
  }
  if (!offeredCourseSection) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Offered Course section not found',
    );
  }

  if (
    offeredCourseSection.maxCapacity &&
    offeredCourseSection.currentlyEnrolledStudent &&
    offeredCourseSection.currentlyEnrolledStudent >=
      offeredCourseSection.maxCapacity
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Student capacity is full');
  }

  await prisma.$transaction(async ts => {
    await ts.studentSemesterRegistrationCourse.create({
      data: {
        studentId: student?.id,
        semesterRegistrationId: semesterRegistration?.id,
        offeredCourseId: payload?.offeredCourseId,
        offeredCourseSectionId: payload?.offeredCourseSectionId,
      },
    });

    await ts.offeredCourseSection.update({
      where: {
        id: payload.offeredCourseSectionId,
      },
      data: {
        currentlyEnrolledStudent: {
          increment: 1,
        },
      },
    });

    await ts.studentSemesterRegistration.updateMany({
      where: {
        student: {
          id: student.id,
        },
        semesterRegistration: {
          id: semesterRegistration.id,
        },
      },
      data: {
        totalCreditTaken: {
          increment: offeredCourse.course.credits,
        },
      },
    });
  });

  return { message: 'Successfully enroll into course' };
};

const withdrawFromCourse = async (
  authId: string,
  payload: IEnrollCoursePayload,
) => {
  const student = await prisma.student.findUnique({
    where: {
      studentId: authId,
    },
  });

  const semesterRegistration = await prisma.semesterRegistration.findFirst({
    where: {
      status: SemesterRegistrationStatus.ONGOING,
    },
  });

  const offeredCourse = await prisma.offeredCourse.findFirst({
    where: { id: payload.offeredCourseId },
    include: { course: true },
  });

  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }

  if (!semesterRegistration) {
    throw new ApiError(httpStatus.NOT_FOUND, 'semester registration not found');
  }

  if (!offeredCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Offered Course not found');
  }

  await prisma.$transaction(async ts => {
    await ts.studentSemesterRegistrationCourse.delete({
      where: {
        semesterRegistrationId_studentId_offeredCourseId: {
          semesterRegistrationId: semesterRegistration?.id,
          studentId: student?.id,
          offeredCourseId: payload?.offeredCourseId,
        },
      },
    });

    await ts.offeredCourseSection.update({
      where: {
        id: payload.offeredCourseSectionId,
      },
      data: {
        currentlyEnrolledStudent: {
          decrement: 1,
        },
      },
    });

    await ts.studentSemesterRegistration.updateMany({
      where: {
        student: {
          id: student.id,
        },
        semesterRegistration: {
          id: semesterRegistration.id,
        },
      },
      data: {
        totalCreditTaken: {
          decrement: offeredCourse.course.credits,
        },
      },
    });
  });

  return { message: 'Successfully withdraw from course' };
};

const confrimMyRegistration = async (
  authId: string,
): Promise<{
  message: string;
}> => {
  const semesterRegistration = await prisma.semesterRegistration.findFirst({
    where: {
      status: SemesterRegistrationStatus.ONGOING,
    },
  });

  const studentSemesterRegistration =
    await prisma.studentSemesterRegistration.findFirst({
      where: {
        semesterRegistration: {
          id: semesterRegistration?.id,
        },
        student: {
          studentId: authId,
        },
      },
    });

  if (!startMyRegistration) {
    throw new ApiError(httpStatus.NOT_FOUND, 'no semester oning now');
  }
  if (!studentSemesterRegistration) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You are not recognized for this semester',
    );
  }

  if (studentSemesterRegistration.totalCreditTaken === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You are not enroll in any course',
    );
  }

  if (
    studentSemesterRegistration.totalCreditTaken &&
    semesterRegistration?.minCredit &&
    semesterRegistration.maxCredit &&
    (studentSemesterRegistration?.totalCreditTaken <
      semesterRegistration?.minCredit ||
      studentSemesterRegistration.totalCreditTaken >
        semesterRegistration?.maxCredit)
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You can take only ${semesterRegistration.minCredit} to ${semesterRegistration.maxCredit}`,
    );
  }

  await prisma.studentSemesterRegistration.update({
    where: {
      id: studentSemesterRegistration.id,
    },
    data: {
      isConfirmed: true,
    },
  });

  return {
    message: 'Registration confirm successfull',
  };
};

const getMyRegistration = async (authId: string) => {
  const semesterRegistration = await prisma.semesterRegistration.findFirst({
    where: {
      status: SemesterRegistrationStatus.ONGOING,
    },
    include: {
      academicSemester: true,
    },
  });

  const studentSemesterRegistration =
    await prisma.studentSemesterRegistration.findFirst({
      where: {
        semesterRegistration: {
          id: semesterRegistration?.id,
        },
        student: {
          studentId: authId,
        },
      },
      include: {
        student: true,
      },
    });
  return {
    semesterRegistration,
    studentSemesterRegistration,
  };
};

const startNewSemester = async (id: string): Promise<{ message: string }> => {
  const semesterRegistration = await prisma.semesterRegistration.findUnique({
    where: {
      id,
    },
    include: {
      academicSemester: true,
    },
  });
  if (!semesterRegistration) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Semester not found');
  }

  if (semesterRegistration.status !== SemesterRegistrationStatus.ENDED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Semester registration not ended yet',
    );
  }

  // if (semesterRegistration.academicSemester.isCurrent) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Semester is already started');
  // }

  await prisma.$transaction(async prismaTransactionClient => {
    await prismaTransactionClient.academicSemester.updateMany({
      where: {
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });

    await prismaTransactionClient.academicSemester.update({
      where: {
        id: semesterRegistration.academicSemester.id,
      },
      data: {
        isCurrent: true,
      },
    });

    const studentSemesterRegistrations =
      await prismaTransactionClient.studentSemesterRegistration.findMany({
        where: {
          semesterRegistration: {
            id,
          },
          isConfirmed: true,
        },
      });

    await asyncForEach(
      studentSemesterRegistrations,
      async (stuSemReg: StudentSemesterRegistration) => {
        if (stuSemReg.totalCreditTaken) {
          const totalPaymentAmount = stuSemReg.totalCreditTaken * 5000;
          await studentSemesterPaymentService.createSemesterPayment(
            prismaTransactionClient,
            {
              studentId: stuSemReg?.studentId,
              academicSemesterId: semesterRegistration?.academicSemesterId,
              totalPaymentAmount,
            },
          );
        }

        const studentSemesterRegistrationCourses =
          await prismaTransactionClient.studentSemesterRegistrationCourse.findMany(
            {
              where: {
                semesterRegistration: {
                  id,
                },
                student: {
                  id: stuSemReg.studentId,
                },
              },
              include: {
                offeredCourse: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          );

        await asyncForEach(
          studentSemesterRegistrationCourses,
          async (
            item: StudentSemesterRegistration & {
              offeredCourse: OfferedCourse & { course: Course };
            },
          ) => {
            const isExistEnrollData =
              await prismaTransactionClient.studentEnrollCourse.findFirst({
                where: {
                  studentId: item.studentId,
                  courseId: item.offeredCourse.courseId,
                  academicSemesterId: semesterRegistration.academicSemesterId,
                },
              });

            if (!isExistEnrollData) {
              const enrolledCourseData = {
                studentId: item.studentId,
                courseId: item.offeredCourse.courseId,
                academicSemesterId: semesterRegistration.academicSemesterId,
              };

              const studentEnrolledCourseData =
                await prismaTransactionClient.studentEnrollCourse.create({
                  data: enrolledCourseData,
                });

              await studentEnrolledCourseMarkService.createStudentEnrolledCourseDefaultMark(
                prismaTransactionClient,
                {
                  studentId: item.studentId,
                  studentEnrolledCourseId: studentEnrolledCourseData?.id,
                  academicSemesterId: semesterRegistration.academicSemesterId,
                },
              );
            }
          },
        );
      },
    );
  });

  return {
    message: 'Semester start successfully',
  };

  // --------start semester code finisehd---------
};

const getMySemesterRegistrationCourses = async (authUserId: string) => {
  const student = await prisma.student.findUnique({
    where: {
      studentId: authUserId,
    },
  });

  const semesterRegistration = await prisma.semesterRegistration.findFirst({
    where: {
      status: {
        in: [
          SemesterRegistrationStatus.UPCOMING,
          SemesterRegistrationStatus.ONGOING,
        ],
      },
    },
  });
  if (!semesterRegistration) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'semestration registration not found',
    );
  }
  const studentCompletedCourse = await prisma.studentEnrollCourse.findMany({
    where: {
      status: StudentErolledCourseStatus.COMPLETED,
      student: {
        studentId: authUserId,
      },
    },
    include: {
      course: true,
    },
  });
  // console.log(studentCompletedCourse);

  const studentCurrentSemesterTakenCourse =
    await prisma.studentSemesterRegistrationCourse.findMany({
      where: {
        student: {
          id: student?.id,
        },
        semesterRegistration: {
          id: semesterRegistration.id,
        },
      },
      include: {
        offeredCourse: true,
        offeredCourseSection: true,
      },
    });

  const offeredCourse = await prisma.offeredCourse.findMany({
    where: {
      semesterRegistration: {
        id: semesterRegistration.id,
      },
      academicDepartment: {
        id: student?.academicDepartmentId,
      },
    },
    include: {
      course: {
        include: {
          preRequisite: {
            include: {
              preRequisite: true,
            },
          },
        },
      },
      offeredCourseSections: {
        include: {
          offeredCourseClassSchedules: {
            include: {
              room: {
                include: {
                  buildings: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const availableCourses = semesterRegistrationUtils.getAvailableCourses(
    offeredCourse,
    studentCompletedCourse,
    studentCurrentSemesterTakenCourse,
  );
  return availableCourses;
};

export const SemesterRegistrationService = {
  createSemesterRegistration,
  getAllSemesterRegistration,
  getSingleSemesterRegistration,
  updateSemesterRegistration,
  deleteSemesterRegistration,
  startMyRegistration,
  enrollIntoCourse,
  withdrawFromCourse,
  confrimMyRegistration,
  getMyRegistration,
  startNewSemester,
  getMySemesterRegistrationCourses,
};
