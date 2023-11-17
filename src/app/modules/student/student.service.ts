/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma, Student, StudentErolledCourseStatus } from '@prisma/client';
import calculatePagination from '../../../helper/calculatePagination';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { generateId } from '../../../utils/generateUserId';
import { studentSearchableFields } from './student.constant';
import { IStudentFilters } from './student.interface';
import { studentUtils } from './student.utils';

const createStudent = async (data: Student): Promise<Student> => {
  const academicSemester = await prisma.academicSemester.findFirst({
    where: { id: data.academicSemesterId },
  });
  const newId = await generateId.generateStudentId(academicSemester);

  data.studentId = newId;

  const newStudent = await prisma.student.create({
    data,
  });
  return newStudent;
};

const getAllStudents = async (
  options: IPaginationOptions,
  filters: IStudentFilters,
): Promise<IGenericResponse<Student[]>> => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, ...fitersData } = filters;
  const andCondtions = [];
  // const sortCondition: { [key: string]: string } = {};

  if (searchTerm) {
    andCondtions.push({
      OR: studentSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (fitersData && Object.keys(fitersData).length > 0) {
    andCondtions.push({
      AND: Object.entries(fitersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }
  const whereCondition: Prisma.StudentWhereInput =
    andCondtions.length > 0 ? { AND: andCondtions } : {};
  // sortCondition[sortBy] = sortOrder;
  const result = await prisma.student.findMany({
    skip,
    take: limit,
    where: whereCondition,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });
  const total = await prisma.student.count({ where: whereCondition });
  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getSingleStudent = async (id: string): Promise<Student | null> => {
  const result = await prisma.student.findUnique({
    where: { studentId: id },
  });
  return result;
};

const updateStudent = async (
  id: string,
  data: Partial<Student>,
): Promise<Student> => {
  const result = await prisma.student.update({
    where: { studentId: id },
    data,
  });
  return result;
};
const deleteStudent = async (id: string): Promise<Student> => {
  const result = await prisma.student.delete({
    where: { studentId: id },
  });
  return result;
};

const myCourses = async (
  authUserId: string,
  filters: {
    courseId?: string | undefined;
    academicSemesterId?: string | undefined;
  },
) => {
  if (!filters.academicSemesterId) {
    const currentSemester = await prisma.academicSemester.findFirst({
      where: {
        isCurrent: true,
      },
    });
    filters.academicSemesterId = currentSemester?.id;
  }

  const result = await prisma.studentEnrollCourse.findMany({
    where: {
      student: {
        studentId: authUserId,
      },
      ...filters,
    },
    include: {
      course: true,
    },
  });
  return result;
};

const getMyCourseSchedules = async (
  authUserId: string,
  filters: {
    courseId?: string | undefined;
    academicSemesterId?: string | undefined;
  },
) => {
  if (!filters.academicSemesterId) {
    const currentSemester = await prisma.academicSemester.findFirst({
      where: {
        isCurrent: true,
      },
    });
    filters.academicSemesterId = currentSemester?.id;
  }

  const studentEnrolledCourses = await myCourses(authUserId, filters);
  const studentEnrolledCourseIds = studentEnrolledCourses.map(
    item => item.courseId,
  );
  const result = await prisma.studentSemesterRegistrationCourse.findMany({
    where: {
      student: {
        studentId: authUserId,
      },
      semesterRegistration: {
        academicSemester: {
          id: filters.academicSemesterId,
        },
      },
      offeredCourse: {
        course: {
          id: {
            in: studentEnrolledCourseIds,
          },
        },
      },
    },
    include: {
      offeredCourse: {
        include: { course: true },
      },
      offeredCourseSection: {
        include: {
          offeredCourseClassSchedules: {
            include: {
              room: {
                include: {
                  buildings: true,
                },
              },
              faculty: true,
            },
          },
        },
      },
    },
  });
  return result;
};

const myAcademicInfo = async (authUserId: string) => {
  const academicInfo = await prisma.studentAcademicInfo.findFirst({
    where: {
      student: {
        studentId: authUserId,
      },
    },
  });

  const enrolledCourses = await prisma.studentEnrollCourse.findMany({
    where: {
      student: {
        studentId: authUserId,
      },
      status: StudentErolledCourseStatus.COMPLETED,
    },
    include: {
      course: true,
      academicSemester: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
  const groupByAcademicSemesterData =
    studentUtils.groupByAcademicSemester(enrolledCourses);

  return { academicInfo, courses: groupByAcademicSemesterData };
};

export const studentService = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent,
  myCourses,
  getMyCourseSchedules,
  myAcademicInfo,
};
