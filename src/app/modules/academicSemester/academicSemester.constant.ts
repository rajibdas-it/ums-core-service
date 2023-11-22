export const academicSemesterFilterableFields = [
  'searchTerm',
  'title',
  'year',
  'code',
];

export const academicSemesterSearchableFields = ['title', 'year', 'code'];

export const academicSemesterMapper: { [key: string]: string } = {
  Autumn: '01',
  Summer: '02',
  Fall: '03',
};

export const academicSemesterMonths: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const academicSemesterTitles: string[] = ['Autumn', 'Summer', 'Fall'];

export const academicSemesterCodes: string[] = ['01', '02', '03'];

export const Event_Academic_Semester_Created = 'academicSemester.created';
export const Event_Academic_Semester_Updated = 'academicSemester.updated';
export const Event_Academic_Semester_Deleted = 'academicSemester.deleted';
