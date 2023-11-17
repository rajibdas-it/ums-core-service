import express from 'express';
import { ENUM_USER_ROLE } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { semesterRegistrationValidation } from './semesterRagistration.validation';
import { SemesterRegistrationController } from './semesterRegistration.controller';

const router = express.Router();

router.get(
  '/my-registration-courses',
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.getMySemesterRegistrationCourses,
);

router.get(
  '/my-registration',
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.getMyRegistration,
);

router.post(
  '/create-semester-registration',
  // validateRequest(
  //   semesterRegistrationValidation.createSemesterRegistrationZodSchema,
  // ),
  SemesterRegistrationController.createSemesterRegistration,
);
router.get('/', SemesterRegistrationController.getAllSemesterRegistration);
router.get(
  '/:id',
  SemesterRegistrationController.getSingleSemesterRegistration,
);
router.patch(
  '/update-semester-registration/:id',
  validateRequest(
    semesterRegistrationValidation.updateSemesterRegistrationZodSchema,
  ),
  SemesterRegistrationController.updateSemesterRegistration,
);

router.delete(
  '/delete-semester-registration/:id',
  SemesterRegistrationController.deleteSemesterRegistration,
);
router.post(
  '/start-registration',
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.startMyRegistration,
);

router.post(
  '/enroll-course',
  validateRequest(semesterRegistrationValidation.enrollAndWithdrawCouse),
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.enrollIntoCourse,
);
router.post(
  '/withdraw-course',
  validateRequest(semesterRegistrationValidation.enrollAndWithdrawCouse),
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.withdrawFromCourse,
);
router.post(
  '/confirm-registration',
  auth(ENUM_USER_ROLE.STUDENT),
  SemesterRegistrationController.confrimMyRegistration,
);
router.post(
  '/:id/start-new-semester',
  SemesterRegistrationController.startNewSemester,
);

export const semesterRegistrationRoutes = router;
