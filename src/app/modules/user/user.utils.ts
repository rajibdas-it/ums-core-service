import { ENUM_USER_ROLE } from '../../../enums/user';
import { IAcademicSemester } from '../academicSemester/academicSemeter.interface';
import User from './user.model';

const findLastStudentId = async () => {
  const lastUser = await User.findOne(
    { role: ENUM_USER_ROLE.STUDENT },
    { id: 1, _id: 0 },
  )
    .sort({ createdAt: -1 })
    .lean();
  return lastUser?.id;
};

export const generateStudentId = async (
  academicSemester: IAcademicSemester | null,
): Promise<string> => {
  const currentId =
    (await findLastStudentId()) || (0).toString().padStart(5, '0');
  let incrementId = (Number(currentId.substring(4)) + 1)
    .toString()
    .padStart(5, '0');
  incrementId = `${academicSemester?.year.substring(
    2,
  )}${academicSemester?.code}${incrementId}`;

  return incrementId;
};

export const findLastFacultyId = async () => {
  const lastFaculty = await User.findOne(
    { role: ENUM_USER_ROLE.FACULTY },
    { id: 1, _id: 0 },
  )
    .sort({ createdAt: -1 })
    .lean();

  return lastFaculty?.id;
};

export const generateFacultyId = async (): Promise<string> => {
  const currentId =
    (await findLastFacultyId()) || (0).toString().padStart(5, '0');
  // const splitingId = currentId.split('-');
  // let incrementId = (Number(splitingId[1]) + 1).toString().padStart(5, '0');

  let incrementId = (Number(currentId.substring(2)) + 1)
    .toString()
    .padStart(5, '0');
  incrementId = `F-${incrementId}`;
  return incrementId;
};

export const findLastAdminId = async () => {
  const result = await User.findOne({ role: 'admin' })
    .sort({ createdAt: -1 })
    .lean();
  return result?.id ? result?.id.substring(2) : null;
};

export const generateAdminId = async () => {
  const currentId =
    (await findLastAdminId()) || (0).toString().padStart(5, '0');
  let incrementedId = (Number(currentId) + 1).toString().padStart(5, '0');
  return (incrementedId = `A-${incrementedId}`);
};
