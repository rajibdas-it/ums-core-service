/* eslint-disable @typescript-eslint/no-explicit-any */
const getAvailableCourses = (
  offeredCourses: any,
  studentCompletedCourses: any,
  studentCurrentlyCourses: any,
) => {
  const completedCourseId = studentCompletedCourses.map(
    (course: any) => course.courseId,
  );

  // available course jegula ami complete korsi oi badh e

  const availableCoursesList = offeredCourses
    .filter(
      (offeredCourse: any) => !completedCourseId.includes(offeredCourse.id),
    )
    .filter((course: any) => {
      const preRequisites = course.course.preRequisite;
      if (preRequisites.length === 0) {
        return true;
      } else {
        const preRequisiteIds = preRequisites.map(
          (preRequisite: any) => preRequisite?.preRequisiteId,
        );
        return preRequisiteIds.every((id: string) =>
          completedCourseId.includes(id),
        );
      }
    })
    .map((course: any) => {
      const isAlreadyTakenCourse = studentCurrentlyCourses.find(
        (c: any) => c.offeredCourseId === course.id,
      );
      if (isAlreadyTakenCourse) {
        course.offeredCourseSections.map((section: any) => {
          if (section.id === isAlreadyTakenCourse.offeredCourseSectionId) {
            section.isTaken = true;
          } else {
            section.isTaken = false;
          }
        });
        return { ...course, isTaken: true };
      } else {
        course.offeredCourseSections.map((section: any) => {
          section.isTaken = false;
        });
        return {
          ...course,
          isTaken: false,
        };
      }
    });
  return availableCoursesList;
};

export const semesterRegistrationUtils = {
  getAvailableCourses,
};
