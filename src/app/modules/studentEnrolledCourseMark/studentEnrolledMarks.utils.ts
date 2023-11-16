import { Course, StudentEnrollCourse } from '@prisma/client';

const getGradeFromMarks = (marks: number) => {
  let result: { grade: string; point?: number } = {
    grade: '',
    point: 0,
  };
  if (marks >= 0 && marks <= 39) {
    result = {
      grade: 'F',
      point: 0,
    };
  } else if (marks >= 40 && marks <= 50) {
    result = {
      grade: 'D',
      point: 2.0,
    };
  } else if (marks >= 51 && marks <= 59) {
    result = {
      grade: 'C',
      point: 2.5,
    };
  } else if (marks >= 60 && marks <= 69) {
    result = {
      grade: 'B',
      point: 3.0,
    };
  } else if (marks >= 71 && marks <= 79) {
    result = {
      grade: 'A',
      point: 3.5,
    };
  } else if (marks >= 80 && marks <= 100) {
    result = {
      grade: 'A+',
      point: 4.0,
    };
  }
  return result;
};

const calculateTotalCGPAandGrade = (
  paylaod: (StudentEnrollCourse & { course: Course })[],
) => {
  if (paylaod.length === 0) {
    return {
      totalCompletedCredit: 0,
      cgpa: 0,
    };
  }

  let totalCredit = 0;
  let totalCGPA = 0;
  for (const grade of paylaod) {
    totalCGPA += grade?.point || 0;
    totalCredit += grade.course.credits || 0;
  }

  const avgCPGA = Number((totalCGPA / paylaod.length).toFixed(2));
  return {
    totalCompletedCredit: totalCredit,
    cgpa: avgCPGA,
  };
};

export const studentEnrollCourseMarkUtils = {
  getGradeFromMarks,
  calculateTotalCGPAandGrade,
};
