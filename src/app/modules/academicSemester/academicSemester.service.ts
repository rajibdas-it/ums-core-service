import { AcademicSemester, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import calculatePagination from '../../../helper/calculatePagination';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import prisma from '../../../shared/prisma';
import { RedisClient } from '../../../shared/redis';
import {
  Event_Academic_Semester_Created,
  academicSemesterMapper,
  academicSemesterSearchableFields,
} from './academicSemester.constant';
import { IFilters } from './academicSemester.interface';

const createAcademicSemester = async (
  data: AcademicSemester,
): Promise<AcademicSemester | null> => {
  if (academicSemesterMapper[data.title] !== data.code) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'semester title and code not matched',
    );
  }

  const isExisting = await prisma.academicSemester.findFirst({
    where: {
      title: data.title,
      code: data.code,
      year: data.year,
    },
  });

  if (isExisting) {
    throw new ApiError(httpStatus.CONFLICT, 'Already exist');
  }

  const result = await prisma.academicSemester.create({
    data,
  });

  if (result) {
    await RedisClient.publish(
      Event_Academic_Semester_Created,
      JSON.stringify(result),
    );
  }

  return result;
};

const getAllAcademicSemester = async (
  filters: IFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<AcademicSemester[]>> => {
  const { searchTerm, ...fitersData } = filters;
  const andCondition = [];

  if (searchTerm) {
    andCondition.push({
      OR: academicSemesterSearchableFields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      })),
    });
  }

  if (fitersData && Object.keys(fitersData).length > 0) {
    andCondition.push({
      AND: Object.entries(fitersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  // Prisma.$AcademicSemesterPayload;
  const whereCondition: Prisma.AcademicSemesterWhereInput =
    andCondition.length > 0 ? { AND: andCondition } : {};

  const result = await prisma.academicSemester.findMany({
    take: limit,
    skip,
    where: whereCondition,

    orderBy:
      sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
  });
  const total = await prisma.academicSemester.count({
    where: whereCondition,
  });
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleAcademicSemester = async (
  id: string,
): Promise<AcademicSemester | null> => {
  const result = await prisma.academicSemester.findUnique({
    where: {
      id,
    },
  });
  return result;
};

const updateAcademicSemester = async (
  id: string,
  data: Partial<AcademicSemester>,
): Promise<AcademicSemester | null> => {
  const result = await prisma.academicSemester.update({
    where: { id },
    data,
  });
  return result;
};
const deleteAcademicSemester = async (
  id: string,
): Promise<AcademicSemester | null> => {
  const result = await prisma.academicSemester.delete({
    where: { id },
  });
  return result;
};

export const academicSemesterService = {
  createAcademicSemester,
  getAllAcademicSemester,
  getSingleAcademicSemester,
  updateAcademicSemester,
  deleteAcademicSemester,
};
