import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      passwordHash: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
  console.log('✓ Created admin user');

  // Create teachers
  const teacher1 = await prisma.user.create({
    data: {
      email: 'john.doe@school.com',
      passwordHash: await hashPassword('teacher123'),
      firstName: 'John',
      lastName: 'Doe',
      role: 'TEACHER',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'jane.smith@school.com',
      passwordHash: await hashPassword('teacher123'),
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'TEACHER',
    },
  });
  console.log('✓ Created teachers');

  // Create classes
  const class1 = await prisma.class.create({
    data: {
      name: 'Math 101',
      gradeLevel: '10',
      teacherId: teacher1.id,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'English 101',
      gradeLevel: '10',
      teacherId: teacher2.id,
    },
  });

  const class3 = await prisma.class.create({
    data: {
      name: 'Science 101',
      gradeLevel: '9',
      teacherId: teacher1.id,
    },
  });
  console.log('✓ Created classes');

  // Create 20 students per class (60 total)
  const firstNames = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
    'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tina',
    'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zack', 'Amy', 'Ben', 'Chloe', 'Daniel',
    'Emma', 'Felix', 'Gina', 'Hugo', 'Iris', 'James', 'Kelly', 'Leo', 'Maya', 'Nathan',
    'Oscar', 'Paula', 'Quincy', 'Ruby', 'Steve', 'Tara', 'Ulysses', 'Vera', 'Walter', 'Xena',
    'Yale', 'Zoe', 'Aaron', 'Beth', 'Carl', 'Donna', 'Eric', 'Fiona', 'Gary', 'Hannah'
  ];

  const lastNames = [
    'Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas',
    'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
    'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
    'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner',
    'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
    'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox'
  ];

  const studentNames = [];
  const classes = [class1, class2, class3];
  
  // Create 20 students for each class
  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    for (let i = 0; i < 20; i++) {
      const studentIndex = classIndex * 20 + i;
      studentNames.push({
        firstName: firstNames[studentIndex % firstNames.length],
        lastName: lastNames[studentIndex % lastNames.length],
        classId: classes[classIndex].id,
      });
    }
  }

  const students = await Promise.all(
    studentNames.map((data) => prisma.student.create({ data }))
  );
  console.log(`✓ Created ${students.length} students (20 per class)`);

  // Create attendance records for the past year (365 days)
  console.log('Creating 1 year of attendance data for 60 students...');
  const statuses = [
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'ABSENT',
    'LATE',
    'LEAVE',
  ];

  const teacherStatuses = [
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'PRESENT',
    'ABSENT',
    'LEAVE',
  ];

  let totalRecordsCreated = 0;
  const totalDays = 365;
  let weekdaysProcessed = 0;

  // Generate attendance for 365 days (1 year)
  for (let i = 0; i < totalDays; i++) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    weekdaysProcessed++;

    // Student attendance - batch create for better performance
    const studentAttendanceRecords = [];
    for (const student of students) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const teacherId = student.classId === class1.id || student.classId === class3.id 
        ? teacher1.id 
        : teacher2.id;

      studentAttendanceRecords.push({
        studentId: student.id,
        classId: student.classId,
        status,
        recordedBy: teacherId,
        date,
      });
    }

    // Batch create student attendance
    await prisma.attendanceRecord.createMany({
      data: studentAttendanceRecords,
    });
    totalRecordsCreated += studentAttendanceRecords.length;

    // Teacher attendance
    for (const teacher of [teacher1, teacher2]) {
      const status = teacherStatuses[Math.floor(Math.random() * teacherStatuses.length)];
      
      await prisma.teacherAttendance.create({
        data: {
          teacherId: teacher.id,
          status,
          date,
        },
      });
    }

    // Log progress every 50 weekdays
    if (weekdaysProcessed % 50 === 0) {
      console.log(`  Progress: ${weekdaysProcessed} weekdays processed (${totalRecordsCreated.toLocaleString()} student records)...`);
    }
  }
  console.log(`✓ Created ${totalRecordsCreated.toLocaleString()} student attendance records for 1 year (${weekdaysProcessed} weekdays)`);
  console.log(`✓ Created ${weekdaysProcessed * 2} teacher attendance records`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('Admin: admin@school.com / admin123');
  console.log('Teacher 1: john.doe@school.com / teacher123');
  console.log('Teacher 2: jane.smith@school.com / teacher123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
