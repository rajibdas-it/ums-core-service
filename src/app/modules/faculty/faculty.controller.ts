import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { facultyService } from './faculty.service';

const createFaculty = catchAsync(async (req, res) => {
  const data = req.body;

  const result = await facultyService.createFaculty(data);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student created successfully',
    data: result,
  });
});

// const getAllStudents = catchAsync(async (req, res) => {
//   const options = pick(req.query, paginationsFields);
//   const filters = pick(req.query, studentFilterableFields);
//   const result = await studentService.getAllStudents(options, filters);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'student created successfully',
//     meta: result.meta,
//     data: result.data,
//   });
// });
const getSingleFaculty = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await facultyService.getSingleFaculty(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'student created successfully',
    data: result,
  });
});

// const updateStudent = catchAsync(async (req, res) => {
//   const id = req.params.id;
//   const data = req.body;
//   const result = await studentService.updateStudent(id, data);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'student updated successfully',
//     data: result,
//   });
// });
// const deleteStudent = catchAsync(async (req, res) => {
//   const id = req.params.id;

//   const result = await studentService.deleteStudent(id);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'student delete successfully',
//     data: result,
//   });
// });

export const facultyController = {
  createFaculty,
  getSingleFaculty,
};
