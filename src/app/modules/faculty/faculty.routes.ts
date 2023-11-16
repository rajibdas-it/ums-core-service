import express from 'express';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { courseController } from '../course/course.controller';
import { facultyController } from './faculty.controller';
import { facultyValidation } from './faculty.validation';

const router = express.Router();

router.get(
  '/my-courses',
  auth(ENUM_USER_ROLE.FACULTY),
  facultyController.myCourses,
);
router.post('/create-faculty/', facultyController.createFaculty);
// router.get('/', studentController.getAllStudents);
router.get('/:id', facultyController.getSingleFaculty);

// router.patch(
//   '/:id',
//   auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
//   studentController.updateStudent,
// );
// router.delete(
//   '/delete-student/:id',
//   auth(ENUM_USER_ROLE.SUPER_ADMIN, ENUM_USER_ROLE.ADMIN),
//   studentController.deleteStudent,
// );

router.post(
  '/:id/assign-course',
  validateRequest(facultyValidation.assignOrRemoveCourses),
  courseController.assignCourses,
);
router.delete(
  '/:id/remove-course',
  validateRequest(facultyValidation.assignOrRemoveCourses),
  courseController.removeCourses,
);

export const facultiesRoute = router;
