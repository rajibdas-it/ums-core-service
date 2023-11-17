import express from 'express';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import { studentController } from './student.controller';

const router = express.Router();

router.get(
  '/my-courses/',
  auth(ENUM_USER_ROLE.STUDENT),
  studentController.myCourses,
);
router.get(
  '/my-class-schedule',
  auth(ENUM_USER_ROLE.STUDENT),
  studentController.getMyCourseSchedules,
);
router.get(
  '/my-academic-info',
  auth(ENUM_USER_ROLE.STUDENT),
  studentController.myAcademicInfo,
);
router.post(
  '/create-student/',
  auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
  studentController.createStudent,
);
router.get(
  '/',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  studentController.getAllStudents,
);
router.get(
  '/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  studentController.getSingleStudent,
);
router.patch(
  '/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  studentController.updateStudent,
);
router.delete(
  '/delete-student/:id',
  auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
  studentController.deleteStudent,
);

export const studentRoutes = router;
