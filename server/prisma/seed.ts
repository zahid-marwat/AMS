import { PrismaClient } from '@prisma/client';
import { eachDayOfInterval, isWeekend, startOfDay, subMonths } from 'date-fns';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const STUDENTS_PER_CLASS = 30;
const ATTENDANCE_MONTHS = 6;

const studentFirstNames = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
  'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack', 'Amy', 'Ben', 'Chloe', 'Daniel',
  'Emma', 'Felix', 'Gina', 'Hugo', 'Iris', 'James', 'Kelly', 'Leo', 'Maya', 'Nathan',
  'Oscar', 'Paula', 'Quincy', 'Ruby', 'Steve', 'Tara', 'Ulysses', 'Vera', 'Walter', 'Xena',
  'Yale', 'Zoe', 'Aaron', 'Beth', 'Carl', 'Donna', 'Eric', 'Fiona', 'Gary', 'Hannah',
  'Isla', 'Jonah', 'Keira', 'Luca', 'Mason', 'Nora', 'Owen', 'Piper', 'Reid', 'Sienna',
  'Theo', 'Umair', 'Valerie', 'Wyatt', 'Ximena', 'Yusuf', 'Zara', 'Aria', 'Blake', 'Cora',
];

const studentLastNames = [
  'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
  'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
  'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
  'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
  'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox',
  'Bryant', 'Diaz', 'Fisher', 'Gonzalez', 'Harper', 'Jenkins', 'Khan', 'Lawson', 'Mehta', 'Nguyen',
  'Olsen', 'Patel', 'Quinn', 'Reyes', 'Singh', 'Tariq', 'Usman', 'Vasquez', 'West', 'Yadav',
];

const classDefinitions = [
  { name: 'Play Group', gradeLevel: 'Play Group' },
  { name: 'Nursery', gradeLevel: 'Nursery' },
  { name: 'Katchi', gradeLevel: 'Katchi' },
  { name: 'KG', gradeLevel: 'KG' },
  { name: 'Prep', gradeLevel: 'Prep' },
  { name: 'Grade 1', gradeLevel: 'Grade 1' },
  { name: 'Grade 2', gradeLevel: 'Grade 2' },
  { name: 'Grade 3', gradeLevel: 'Grade 3' },
  { name: 'Grade 4', gradeLevel: 'Grade 4' },
  { name: 'Grade 5', gradeLevel: 'Grade 5' },
  { name: 'Grade 6', gradeLevel: 'Grade 6' },
  { name: 'Grade 7', gradeLevel: 'Grade 7' },
  { name: 'Grade 8', gradeLevel: 'Grade 8' },
  { name: 'Grade 9', gradeLevel: 'Grade 9' },
  { name: 'Grade 10', gradeLevel: 'Grade 10' },
] as const;

const teacherProfiles = [
  { firstName: 'Aisha', lastName: 'Rahman' },
  { firstName: 'Bilal', lastName: 'Hassan' },
  { firstName: 'Celine', lastName: 'Arif' },
  { firstName: 'Danish', lastName: 'Qureshi' },
  { firstName: 'Elena', lastName: 'Farooq' },
  { firstName: 'Fahad', lastName: 'Iqbal' },
  { firstName: 'Ghazal', lastName: 'Saleem' },
  { firstName: 'Hassan', lastName: 'Javed' },
  { firstName: 'Iman', lastName: 'Sheikh' },
  { firstName: 'Jibran', lastName: 'Aziz' },
  { firstName: 'Kiran', lastName: 'Latif' },
  { firstName: 'Laiba', lastName: 'Sohail' },
  { firstName: 'Musa', lastName: 'Anwar' },
  { firstName: 'Nida', lastName: 'Shah' },
  { firstName: 'Omar', lastName: 'Yousaf' },
];

const studentStatusPool = [
  'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT',
  'ABSENT', 'LATE', 'LEAVE',
];

const teacherStatusPool = [
  'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LEAVE',
];

function pickStatus(pool: string[]) {
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

async function resetDatabase() {
  console.log('↺ Clearing existing data…');
  await prisma.attendanceDraft.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.teacherAttendance.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
}

function buildRollNumber(index: number) {
  return (index + 1).toString().padStart(2, '0');
}

function buildStudentSeed(classes: Array<{ id: string }>) {
  const data: Array<{ firstName: string; lastName: string; classId: string; rollNumber: string }> = [];

  classes.forEach((klass, classIndex) => {
    for (let idx = 0; idx < STUDENTS_PER_CLASS; idx += 1) {
      const globalIndex = classIndex * STUDENTS_PER_CLASS + idx;
      const firstName = studentFirstNames[globalIndex % studentFirstNames.length];
      const lastName = studentLastNames[(globalIndex * 3 + idx) % studentLastNames.length];
      data.push({
        firstName,
        lastName,
        classId: klass.id,
        rollNumber: buildRollNumber(idx),
      });
    }
  });

  return data;
}

async function main() {
  console.log('🌱 Starting database seed…');

  await resetDatabase();

  const admin = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      passwordHash: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin account ready (${admin.email})`);

  const teacherPasswordHash = await hashPassword('teacher123');

  const teachers: Array<{ id: string; email: string; className: string }> = [];
  const classes: Array<{ id: string; name: string; teacherId: string }> = [];

  for (let index = 0; index < classDefinitions.length; index += 1) {
    const classDef = classDefinitions[index];
    const profile = teacherProfiles[index];
    const slug = classDef.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const email = `${slug || 'class'}-teacher@school.com`;

    const teacher = await prisma.user.create({
      data: {
        email,
        passwordHash: teacherPasswordHash,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: 'TEACHER',
      },
    });

    const klass = await prisma.class.create({
      data: {
        name: classDef.name,
        gradeLevel: classDef.gradeLevel,
        teacherId: teacher.id,
      },
    });

    teachers.push({ id: teacher.id, email, className: classDef.name });
    classes.push({ id: klass.id, name: klass.name, teacherId: teacher.id });
  }

  console.log(`✓ Created ${teachers.length} teachers and matched classes`);

  const studentSeed = buildStudentSeed(classes);
  await prisma.student.createMany({ data: studentSeed });
  const students = await prisma.student.findMany({
    select: { id: true, classId: true, rollNumber: true },
    orderBy: [{ classId: 'asc' }, { rollNumber: 'asc' }],
  });
  console.log(`✓ Added ${students.length} students (${STUDENTS_PER_CLASS} per class)`);

  const classTeacherMap = new Map(classes.map((klass) => [klass.id, klass.teacherId]));

  const today = startOfDay(new Date());
  const startDate = startOfDay(subMonths(today, ATTENDANCE_MONTHS));
  const teachingDays = eachDayOfInterval({ start: startDate, end: today }).filter((date) => !isWeekend(date));

  console.log(`⏱  Generating attendance for ${teachingDays.length} teaching days…`);

  let studentRecordCount = 0;

  for (let dayIndex = 0; dayIndex < teachingDays.length; dayIndex += 1) {
    const date = teachingDays[dayIndex];

    const studentAttendance = students.map((student) => ({
      studentId: student.id,
      classId: student.classId,
      status: pickStatus(studentStatusPool),
      recordedBy: classTeacherMap.get(student.classId)!,
      date,
    }));

    await prisma.attendanceRecord.createMany({ data: studentAttendance });
    studentRecordCount += studentAttendance.length;

    const teacherAttendance = teachers.map((teacher) => ({
      teacherId: teacher.id,
      status: pickStatus(teacherStatusPool),
      date,
    }));

    await prisma.teacherAttendance.createMany({ data: teacherAttendance });

    if ((dayIndex + 1) % 20 === 0 || dayIndex === teachingDays.length - 1) {
      console.log(`  • Processed ${dayIndex + 1} / ${teachingDays.length} days (${studentRecordCount.toLocaleString()} student entries)`);
    }
  }

  console.log(`✓ Generated ${studentRecordCount.toLocaleString()} student attendance records across ${teachingDays.length} teaching days`);
  console.log(`✓ Generated ${teachingDays.length * teachers.length} teacher attendance records`);

  console.log('\n Seed completed successfully!');
  console.log('\n Login credentials:');
  console.log('Admin: admin@school.com / admin123');
  console.log('Teacher accounts:');
  teachers.forEach((teacher) => {
    console.log(` - ${teacher.className}: ${teacher.email} / teacher123`);
  });
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
