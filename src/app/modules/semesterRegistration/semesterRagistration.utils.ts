/* eslint-disable @typescript-eslint/no-explicit-any */
const getAvailableCourses = (
  offeredCourses: any,
  studentCompletedCourses: any,
  studentCurrentlyCourses: any,
) => {
  const completedCourseId = studentCompletedCourses.map(
    (course: any) => course.courseId,
  );

  const availableCourseList = offeredCourses
    .filter(
      (offeredCourse: any) => !completedCourseId.includes(offeredCourse.id),
    )
    .filter((course: any) => {
      const preRequisites = course.course.preRequisite;
      if (preRequisite.length === 0) {
        return true;
      } else {
        const preRequisite = preRequisites.map(
          (preRequisites: any) => preRequisites.preRequisiteId,
          console.log('pre-requite ', preRequisites),
        );

        return;
      }
    });

  return null;
};

export const semesterRegistrationUtils = {
  getAvailableCourses,
};
