import { Model, Types } from 'mongoose';
import { IAcademicDepartment } from '../academicDepartment/department.interface';
import { IAcademicFaculty } from '../academicFaculty/academicFaculty.interface';
import { IAcademicSemester } from './../academicSemester/academicSemeter.interface';

export type IStudentName = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

export type IGuardian = {
  fatherName: string;
  fatherOccupation: string;
  fatherContactNo: string;
  motherName: string;
  motherOccupation: string;
  motherContactNo: string;
};

export type ILocalGuardian = {
  guardianName: string;
  guardianOccupation: string;
  guardianContactNo: string;
};

export type IStudent = {
  id: string;
  name: IStudentName;
  gender: string;
  dateOfBirth: string;
  email: string;
  contactNo: string;
  emergencyContactNo: string;
  presentAddress: string;
  parmanentAddress: string;
  bloodGroup: string;
  guardian: IGuardian;
  localGuardian: ILocalGuardian;
  profileImage?: string;
  academicSemester: Types.ObjectId | IAcademicSemester;
  academicDepartment: Types.ObjectId | IAcademicDepartment;
  academicFaculty: Types.ObjectId | IAcademicFaculty;
};

export type IStudentFilters = {
  searchTerm?: string;
  id?: string;
  gender?: string;
  email?: string;
  contactNo?: string;
  emergencyContactNo?: string;
  bloodGroup?: string;
};

export type IStudentModel = Model<IStudent, Record<string, unknown>>;
