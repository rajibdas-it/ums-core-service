/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { paginationsFields } from '../../../constants/paginations';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { studentFilterableFields } from './student.constant';
import { studentService } from './student.service';

const createStudent = catchAsync(async (req, res) => {
  const data = req.body;

  const result = await studentService.createStudent(data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student created successfully',
    data: result,
  });
});

const getAllStudents = catchAsync(async (req, res) => {
  const options = pick(req.query, paginationsFields);
  const filters = pick(req.query, studentFilterableFields);
  const result = await studentService.getAllStudents(options, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student created successfully',
    meta: result.meta,
    data: result.data,
  });
});
const getSingleStudent = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await studentService.getSingleStudent(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student created successfully',
    data: result,
  });
});

const updateStudent = catchAsync(async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const result = await studentService.updateStudent(id, data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student updated successfully',
    data: result,
  });
});
const deleteStudent = catchAsync(async (req, res) => {
  const id = req.params.id;

  const result = await studentService.deleteStudent(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student delete successfully',
    data: result,
  });
});
const myCourses = catchAsync(async (req, res) => {
  const user = (req as any).user;
  const filters = pick(req.query, ['courseId', 'academicSemesterId']);
  const result = await studentService.myCourses(user.id, filters);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student courses data fetched successfully',
    data: result,
  });
});

const getMyCourseSchedules = catchAsync(async (req, res) => {
  const user = (req as any).user;
  const filter = pick(req.query, ['courseId', 'academicSemesterId']);
  const result = await studentService.getMyCourseSchedules(user?.id, filter);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'my registration courses fetched successfully',
    data: result,
  });
});

export const studentController = {
  createStudent,
  getAllStudents,
  getSingleStudent,
  updateStudent,
  deleteStudent,
  myCourses,
  getMyCourseSchedules,
};
