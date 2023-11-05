import { Schema, model } from 'mongoose';
import { bloodGroup, gender } from '../../../constants/user';
import { designation } from './faculty.constant';
import { IFaculty, IFacultyModel } from './faculty.interface';

const facultySchema = new Schema<IFaculty, IFacultyModel>(
  {
    id: { type: String, unique: true, required: true },
    name: {
      required: true,
      type: {
        firstName: { type: String, required: true },
        middleName: { type: String },
        lastName: { type: String, required: true },
      },
    },
    gender: { type: String, enum: gender, required: true },
    dateOfBirth: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    contactNo: { type: String, unique: true, required: true },
    emergencyContactNo: { type: String, required: true },
    presentAddress: { type: String, required: true },
    parmanentAddress: { type: String, required: true },
    bloodGroup: { type: String, required: true, enum: bloodGroup },
    designation: { type: String, required: true, enum: designation },
    profileImg: { type: String },
    academicDepartment: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicDepartment',
    },
    academicFaculty: { type: Schema.Types.ObjectId, ref: 'AcademicFaculty' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

const Faculty = model<IFaculty, IFacultyModel>('Faculty', facultySchema);
export default Faculty;
