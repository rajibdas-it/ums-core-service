import { z } from 'zod';

const createAcademicDepartment = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    academicFacultyId: z.string({
      required_error: 'academic faculty id is required',
    }),
  }),
});

export const academicDepartmentZodValidation = {
  createAcademicDepartment,
};
