import httpStatus from 'http-status';
import { SortOrder } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import calculatePagination from '../../../helper/calculatePagination';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { academicSemesterMapper } from './academicSemeter.constant';
import {
  IAcademicSemester,
  IAcademicSemesterFilters,
} from './academicSemeter.interface';
import AcademicSemester from './academicSemeter.model';

const createSemester = async (
  paylaod: IAcademicSemester,
): Promise<IAcademicSemester> => {
  if (academicSemesterMapper[paylaod.title] != paylaod.code) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'title and code not matched');
  }
  const result = await AcademicSemester.create(paylaod);
  return result;
};

const getAllSemester = async (
  filters: IAcademicSemesterFilters,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<IAcademicSemester[]>> => {
  const { searchTerm, ...filterData } = filters;

  const andCondition = [];

  const academicSemesterSearchableFields = ['title', 'code', 'year'];
  if (searchTerm) {
    andCondition.push({
      $or: academicSemesterSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  if (Object.keys(filterData).length) {
    andCondition.push({
      $and: Object.entries(filterData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // const andCondition = [
  //   {
  //     $or: [
  //       {
  //         title: {
  //           $regex: searchTerm,
  //           $options: 'i',
  //         },
  //       },
  //       {
  //         year: {
  //           $regex: searchTerm,
  //           $options: 'i',
  //         },
  //       },
  //       {
  //         code: {
  //           $regex: searchTerm,
  //           $options: 'i',
  //         },
  //       },
  //     ],
  //   },
  // ];
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const sortConditions: { [key: string]: SortOrder } = {};

  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }

  const whereCondition = andCondition.length > 0 ? { $and: andCondition } : {};

  const result = await AcademicSemester.find(whereCondition)
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);
  const total = await AcademicSemester.count(whereCondition);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleSemeter = async (
  id: string,
): Promise<IAcademicSemester | null> => {
  const result = await AcademicSemester.findById({ _id: id });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Semester dose not exists');
  }
  return result;
};

const updateSemester = async (
  id: string,
  payload: Partial<IAcademicSemester>,
) => {
  if (
    payload.title &&
    payload.code &&
    academicSemesterMapper[payload.title] != payload?.code
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Semester title and code not matched',
    );
  }
  const result = await AcademicSemester.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });
  return result;
};

const deleteSemester = async (id: string) => {
  const result = await AcademicSemester.findByIdAndDelete({ _id: id });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Semester does not exists');
  }
  return result;
};

export const academicSemesterServices = {
  createSemester,
  getAllSemester,
  getSingleSemeter,
  updateSemester,
  deleteSemester,
};
