import { Course } from '@prisma/client';
import httpStatus from 'http-status';
import { paginationsFields } from '../../../constants/paginations';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { courseFilterableFields } from './course.constant';
import { courseService } from './course.service';

const createCourse = catchAsync(async (req, res) => {
  const data = req.body;
  const result = await courseService.createCourse(data);

  sendResponse<Course>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

const getAllCourses = catchAsync(async (req, res) => {
  const options = pick(req.query, paginationsFields);
  const filters = pick(req.query, courseFilterableFields);
  const result = await courseService.getAllCourses(options, filters);
  sendResponse<Course[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const courseController = {
  createCourse,
  getAllCourses,
};