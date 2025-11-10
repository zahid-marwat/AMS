# AMS Database Schema Reference

This document summarizes the Prisma models that back the AMS application. Use it as a quick reference when you need to add new fields, adjust relationships, or seed data.

## Environment
- **ORM**: Prisma
- **Database**: SQLite (`file:./dev.db`)
- **Primary file**: `schema.prisma`

---

## Entity Overview

### User
Represents both administrators and teachers.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key (`cuid()`). |
| `email` | `String` | Unique user email. |
| `passwordHash` | `String` | Bcrypt or similar hash of password. |
| `firstName` / `lastName` | `String` | Basic profile fields. |
| `role` | `String` | Expected values: `"ADMIN"` or `"TEACHER"`. |
| `createdAt` / `updatedAt` | `DateTime` | Self-managed timestamps. |
| Relations |  | `classes` (teaches `Class` records), `refreshTokens`, `attendanceRecords` (records taken by teacher), `teacherAttendance`, `attendanceDrafts`. |

### Class
Classroom grouping assigned to one teacher.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `name` | `String` | Human-readable identifier. |
| `gradeLevel` | `String` | Grade or level label. |
| `teacherId` | `String?` | Nullable FK to `User`. |
| `createdAt` / `updatedAt` | `DateTime` | Timestamps. |
| Relations |  | `teacher` (`User`), `students`, `attendance`, `drafts`. |

**Business rule**: A class can exist without an assigned teacher, but when present the teacher must be a `User` with role `TEACHER` (enforced in application logic).

### Student
Individual enrolled in a class.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `firstName` / `lastName` | `String` | Student name fields. |
| `rollNumber` | `String` | Unique per class. |
| `classId` | `String` | FK to `Class`. |
| `createdAt` / `updatedAt` | `DateTime` | Timestamps. |
| Relations |  | `class`, `attendance`, `drafts`. |

**Constraint**: Composite unique key on `(classId, rollNumber)` prevents duplicate roll numbers inside the same class.

### AttendanceRecord
Canonical attendance entries (for students).

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `studentId` | `String` | FK to `Student`. |
| `classId` | `String` | FK to `Class`. |
| `status` | `String` | Expected values: `"PRESENT"`, `"ABSENT"`, `"LATE"`, `"LEAVE"`. |
| `recordedBy` | `String` | FK to `User` (teacher who recorded the entry). |
| `recordedAt` | `DateTime` | Timestamp automatically set to `now()`. |
| `date` | `DateTime` | Logical date the attendance applies to. |
| Relations |  | `student`, `class`, `teacher` (alias for the recorder). |

**Constraint**: Composite unique key on `(studentId, date)` ensures only one entry per student per day.

### TeacherAttendance
Tracks whether a teacher was present for a given day.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `teacherId` | `String` | FK to `User`. |
| `status` | `String` | Same status vocabulary as student attendance. |
| `date` | `DateTime` | Logical date. |
| `createdAt` | `DateTime` | Defaults to `now()`. |

**Constraint**: Composite unique key on `(teacherId, date)` to prevent duplicate daily entries.

### AttendanceDraft
Temporary attendance entries saved before submission.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `teacherId` | `String` | FK to `User`. |
| `classId` | `String` | FK to `Class`. |
| `studentId` | `String` | FK to `Student`. |
| `status` | `String` | Same status set as canonical records. |
| `date` | `DateTime` | Applies to the draft entry. |
| `updatedAt` | `DateTime` | Maintained automatically on update. |
| Relations |  | `teacher`, `class`, `student`. |

**Constraint**: Composite unique key on `(teacherId, classId, studentId, date)` so each teacher can store only one draft per student per day per class.

### RefreshToken
Stores issued refresh tokens for authentication.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `String` | Primary key. |
| `token` | `String` | Unique token string. |
| `userId` | `String` | FK to `User`. |
| `expiresAt` | `DateTime` | Expiration timestamp. |
| `createdAt` | `DateTime` | Defaults to `now()`. |

---

## Relationship Summary
- **User → Class**: One-to-many (a teacher can oversee multiple classes). Null `teacherId` leaves a class unassigned.
- **Class → Student**: One-to-many; required participation via `classId`.
- **Student → AttendanceRecord**: One-to-many; records canonical attendance per day.
- **User → AttendanceRecord**: Teachers (recorders) linked through `recordedBy`.
- **User → TeacherAttendance**: One-to-many teacher-level attendance tracking.
- **User/Class/Student → AttendanceDraft**: Drafts tie together the teacher taking attendance, the class, and the student.
- **User → RefreshToken**: One-to-many for authentication refresh flow.

## Modifying the Schema
1. Update `schema.prisma` with model changes.
2. Run `npx prisma migrate dev --name <migration-name>` to create migrations.
3. Update `seed.ts` if seed data must cover new entities.
4. Regenerate the Prisma client with `npx prisma generate`.

Keeping this document current when schema changes will save time for future developers.
