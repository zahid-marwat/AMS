export const Role = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
} as const;

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE: 'LEAVE',
} as const;

export type Role = (typeof Role)[keyof typeof Role];
export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];
