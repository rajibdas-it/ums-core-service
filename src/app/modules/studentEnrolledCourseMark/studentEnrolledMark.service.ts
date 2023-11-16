/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExamType,
  PrismaClient,
  StudentErolledCourseStatus,
} from '@prisma/client';
import {
  DefaultArgs,
  PrismaClientOptions,
} from '@prisma/client/runtime/library';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import prisma from '../../../shared/prisma';
import { studentEnrollCourseMarkUtils } from './studentEnrolledMarks.utils';

const createStudentEnrolledCourseDefaultMark = async (
  prismaClient: Omit<
    PrismaClient<PrismaClientOptions, never, DefaultArgs>,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >,
  payload: {
    studentId: string;
    studentEnrolledCourseId: string;
    academicSemesterId: string;
  },
) => {
  const isExistMidTermData =
    await prismaClient.studentEnrolledCourseMark.findFirst({
      where: {
        studentId: payload.studentId,
        studentEnrolledCourseId: payload.studentEnrolledCourseId,
        academicSemesterId: payload.academicSemesterId,
        examType: ExamType.MIDTERM,
      },
    });

  const isExistFinalData =
    await prismaClient.studentEnrolledCourseMark.findFirst({
      where: {
        studentId: payload.studentId,
        studentEnrolledCourseId: payload.studentEnrolledCourseId,
        academicSemesterId: payload.academicSemesterId,
        examType: ExamType.FINAL,
      },
    });

  if (!isExistMidTermData) {
    await prismaClient.studentEnrolledCourseMark.create({
      data: {
        studentId: payload.studentId,
        studentEnrolledCourseId: payload.studentEnrolledCourseId,
        academicSemesterId: payload.academicSemesterId,
        examType: ExamType.MIDTERM,
      },
    });
  }
  if (!isExistFinalData) {
    await prismaClient.studentEnrolledCourseMark.create({
      data: {
        studentId: payload.studentId,
        studentEnrolledCourseId: payload.studentEnrolledCourseId,
        academicSemesterId: payload.academicSemesterId,
        examType: ExamType.FINAL,
      },
    });
  }
};

const updateStudentMarks = async (payload: any) => {
  const { studentId, academicSemesterId, courseId, examType, marks } = payload;
  const studentEnrollCourseMark =
    await prisma.studentEnrolledCourseMark.findFirst({
      where: {
        student: {
          id: studentId,
        },
        academicSemester: {
          id: academicSemesterId,
        },
        studentEnrolledCourse: {
          course: {
            id: courseId,
          },
        },
        examType,
      },
    });

  if (!studentEnrollCourseMark) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Student enroll course not found',
    );
  }

  const gradeResult = studentEnrollCourseMarkUtils.getGradeFromMarks(marks);

  const updateMarks = await prisma.studentEnrolledCourseMark.update({
    where: {
      id: studentEnrollCourseMark.id,
    },
    data: {
      marks,
      grade: gradeResult.grade,
    },
  });
  return updateMarks;
};

const updateFinalMarks = async (paylaod: any) => {
  const { studentId, academicSemesterId, courseId } = paylaod;

  const studentEnrolledCourse = await prisma.studentEnrollCourse.findFirst({
    where: {
      student: {
        id: studentId,
      },
      academicSemester: {
        id: academicSemesterId,
      },
      course: { id: courseId },
    },
  });
  if (!studentEnrolledCourse) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No enrolled course found');
  }

  const studentEnrollCourseMark =
    await prisma.studentEnrolledCourseMark.findMany({
      where: {
        student: { id: studentId },
        academicSemester: { id: academicSemesterId },
        studentEnrolledCourse: { course: { id: courseId } },
      },
    });

  if (!studentEnrollCourseMark.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no result found');
  }

  const midTermMark =
    studentEnrollCourseMark.find(item => item.examType === ExamType.MIDTERM)
      ?.marks || 0;

  const finalMarks =
    studentEnrollCourseMark.find(item => item.examType === ExamType.FINAL)
      ?.marks || 0;

  const totalmark = Math.ceil(midTermMark * 0.4) + Math.ceil(finalMarks * 0.6);

  const finalResult = studentEnrollCourseMarkUtils.getGradeFromMarks(totalmark);
  const updateMarks = await prisma.studentEnrollCourse.updateMany({
    where: {
      student: {
        id: studentId,
      },
      academicSemester: {
        id: academicSemesterId,
      },
      course: {
        id: courseId,
      },
    },
    data: {
      totalMarks: totalmark,
      grade: finalResult.grade,
      point: finalResult.point,
      status: StudentErolledCourseStatus.COMPLETED,
    },
  });

  if (!updateMarks) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to update marks');
  }

  const grades = await prisma.studentEnrollCourse.findMany({
    where: {
      student: {
        id: studentId,
      },
      status: StudentErolledCourseStatus.COMPLETED,
    },
    include: {
      course: true,
    },
  });
  const academicResult =
    studentEnrollCourseMarkUtils.calculateTotalCGPAandGrade(grades);

  const studentAcademicInfo = await prisma.studentAcademicInfo.findFirst({
    where: {
      student: {
        id: studentId,
      },
    },
  });

  if (studentAcademicInfo) {
    await prisma.studentAcademicInfo.update({
      where: {
        id: studentAcademicInfo.id,
      },
      data: {
        student: {
          connect: {
            id: studentId,
          },
        },
        totalCompletedCredit: academicResult.totalCompletedCredit,
        cgpa: academicResult.cgpa,
      },
    });
  } else {
    await prisma.studentAcademicInfo.create({
      data: {
        student: {
          connect: {
            id: studentId,
          },
        },
        totalCompletedCredit: academicResult.totalCompletedCredit,
        cgpa: academicResult.cgpa,
      },
    });
  }
  return studentAcademicInfo;
};

export const studentEnrolledCourseMarkService = {
  createStudentEnrolledCourseDefaultMark,
  updateStudentMarks,
  updateFinalMarks,
};
