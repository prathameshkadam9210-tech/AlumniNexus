import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seed() {
  console.log('Seeding JJMCOE AlumniNexus...\n')

  // Clean existing data
  console.log('Cleaning existing data...')
  await db.eventRegistration.deleteMany()
  await db.certificate.deleteMany()
  await db.payment.deleteMany()
  await db.notification.deleteMany()
  await db.application.deleteMany()
  await db.mentorship.deleteMany()
  await db.event.deleteMany()
  await db.job.deleteMany()
  await db.analytics.deleteMany()
  await db.user.deleteMany()
  await db.organization.deleteMany()
  console.log('  Done\n')

  // 1. Organizations
  console.log('Creating organizations...')
  const jjmcoe = await db.organization.create({
    data: {
      name: 'Dr. J.J. Magdum College of Engineering, Jaysingpur',
      code: 'JJMCOE', logo: '/logos/jjmcoe.png', website: 'https://jjmcoe.ac.in',
      city: 'Jaysingpur', state: 'Maharashtra', isActive: true,
    },
  })

  // 2. Users
  console.log('Creating users...')

  const admin = await db.user.create({
    data: {
      email: 'admin@jjmcoe.ac.in', password: 'admin123', name: 'Dr. Sanjay Magdum',
      role: 'ADMIN', department: 'Administration', phone: '+91 9876543210',
      bio: 'Portal Administrator', isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const placement = await db.user.create({
    data: {
      email: 'placement@jjmcoe.ac.in', password: 'place123', name: 'Prof. Anil Deshmukh',
      role: 'PLACEMENT_CELL', department: 'Training & Placement', phone: '+91 9876543211',
      bio: 'Placement Officer', isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const departmentAdmins = [
    ['cseadmin@jjmcoe.ac.in', 'CSE Department Admin', 'Computer Science and Engineering (CSE)', 'cse123'],
    ['itadmin@jjmcoe.ac.in', 'IT Department Admin', 'Information Technology (IT)', 'it123'],
    ['aidsadmin@jjmcoe.ac.in', 'AIDS Department Admin', 'Artificial Intelligence and Data Science (AIDS)', 'aids123'],
    ['entcadmin@jjmcoe.ac.in', 'ENTC Department Admin', 'Electronics and Telecommunication (ENTC)', 'entc123'],
    ['mechadmin@jjmcoe.ac.in', 'Mechanical Department Admin', 'Mechanical Engineering (MECH)', 'mech123'],
    ['civiladmin@jjmcoe.ac.in', 'Civil Department Admin', 'Civil Engineering (CE)', 'civil123'],
    ['mcaadmin@jjmcoe.ac.in', 'MCA Department Admin', 'Master in Computer Application (MCA)', 'mca123'],
  ]
  for (const [email, name, department, password] of departmentAdmins) {
    await db.user.create({
      data: { email, password, name, role: 'ADMIN', department, isVerified: true, emailVerified: true, organizationId: jjmcoe.id },
    })
  }

  const alumni1 = await db.user.create({
    data: {
      email: 'rahul.pawar@jjmcoe.ac.in', password: 'demo123', name: 'Rahul Pawar',
      role: 'ALUMNI', department: 'Computer Science and Engineering (CSE)', batch: '2019-2023', graduationYear: 2023,
      company: 'Tata Consultancy Services', designation: 'Software Engineer',
      experience: '2 years', location: 'Pune', skills: 'React, Node.js, TypeScript, AWS',
      linkedinUrl: 'https://linkedin.com/in/rahulpawar', gpa: 8.5, isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const alumni2 = await db.user.create({
    data: {
      email: 'priya.patil@jjmcoe.ac.in', password: 'demo123', name: 'Priya Patil',
      role: 'ALUMNI', department: 'Information Technology (IT)', batch: '2018-2022', graduationYear: 2022,
      company: 'Infosys', designation: 'Technology Analyst',
      experience: '3 years', location: 'Mumbai', skills: 'Java, Spring Boot, Microservices, Docker',
      gpa: 9.1, isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const alumni3 = await db.user.create({
    data: {
      email: 'sachin.kulkarni@jjmcoe.ac.in', password: 'demo123', name: 'Sachin Kulkarni',
      role: 'ALUMNI', department: 'Computer Science and Engineering (CSE)', batch: '2017-2021', graduationYear: 2021,
      company: 'Persistent Systems', designation: 'Senior Software Developer',
      experience: '4 years', location: 'Pune', skills: 'Python, Django, React, PostgreSQL',
      gpa: 8.8, isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const alumni4 = await db.user.create({
    data: {
      email: 'megha.joshi@jjmcoe.ac.in', password: 'demo123', name: 'Megha Joshi',
      role: 'ALUMNI', department: 'Electronics and Telecommunication (ENTC)', batch: '2019-2023', graduationYear: 2023,
      company: 'Wipro', designation: 'Embedded Systems Engineer',
      experience: '2 years', location: 'Bangalore', skills: 'C, C++, Embedded C, IoT',
      gpa: 8.2, isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const alumni5 = await db.user.create({
    data: {
      email: 'amol.mane@jjmcoe.ac.in', password: 'demo123', name: 'Amol Mane',
      role: 'ALUMNI', department: 'Mechanical Engineering (MECH)', batch: '2018-2022', graduationYear: 2022,
      company: 'Mahindra & Mahindra', designation: 'Design Engineer',
      experience: '3 years', location: 'Nashik', skills: 'AutoCAD, SolidWorks, CATIA, ANSYS',
      gpa: 7.9, isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
    },
  })

  const students = []
  const studentData = [
    { name: 'Aditya Shinde', email: 'aditya.shinde@jjmcoe.ac.in', dept: 'Computer Science and Engineering (CSE)', batch: '2021-2025', skills: 'React, TypeScript, Node.js, Python', gpa: 8.7 },
    { name: 'Sneha Kulkarni', email: 'sneha.kulkarni@jjmcoe.ac.in', dept: 'Information Technology (IT)', batch: '2021-2025', skills: 'Java, Web Dev, SQL, Git', gpa: 9.2 },
    { name: 'Rohan Jadhav', email: 'rohan.jadhav@jjmcoe.ac.in', dept: 'Computer Science and Engineering (CSE)', batch: '2022-2026', skills: 'Python, ML, Data Science, TensorFlow', gpa: 8.4 },
    { name: 'Pooja Gaikwad', email: 'pooja.gaikwad@jjmcoe.ac.in', dept: 'Electronics and Telecommunication (ENTC)', batch: '2021-2025', skills: 'Arduino, IoT, C Programming', gpa: 8.9 },
    { name: 'Akash Patil', email: 'akash.patil@jjmcoe.ac.in', dept: 'Information Technology (IT)', batch: '2022-2026', skills: 'React, Flutter, Firebase, Dart', gpa: 7.8 },
    { name: 'Neha Chavan', email: 'neha.chavan@jjmcoe.ac.in', dept: 'Computer Science and Engineering (CSE)', batch: '2021-2025', skills: 'JavaScript, Vue.js, Node.js, MongoDB', gpa: 8.5 },
    { name: 'Saurabh Desai', email: 'saurabh.desai@jjmcoe.ac.in', dept: 'Mechanical Engineering (MECH)', batch: '2022-2026', skills: 'SolidWorks, MATLAB, ANSYS', gpa: 7.6 },
    { name: 'Kavita Raut', email: 'kavita.raut@jjmcoe.ac.in', dept: 'Information Technology (IT)', batch: '2021-2025', skills: 'Java, AWS, DevOps, Docker', gpa: 8.3 },
    { name: 'Vikram More', email: 'vikram.more@jjmcoe.ac.in', dept: 'Computer Science and Engineering (CSE)', batch: '2022-2026', skills: 'Go, Kubernetes, CI/CD, Linux', gpa: 9.0 },
    { name: 'Swati Bhosle', email: 'swati.bhosle@jjmcoe.ac.in', dept: 'Electronics and Telecommunication (ENTC)', batch: '2022-2026', skills: 'VLSI, Verilog, FPGA, Embedded Systems', gpa: 8.1 },
  ]

  for (const s of studentData) {
    students.push(await db.user.create({
      data: {
        email: s.email, password: 'demo123', name: s.name, role: 'STUDENT',
        department: s.dept, batch: s.batch, skills: s.skills, gpa: s.gpa,
        isVerified: true, emailVerified: true, organizationId: jjmcoe.id,
      },
    }))
  }

  const recruiter1 = await db.user.create({
    data: {
      email: 'hr@tcs.com', password: 'demo123', name: 'TCS HR Team',
      role: 'RECRUITER', company: 'Tata Consultancy Services', designation: 'HR Manager',
      location: 'Mumbai', skills: 'Recruitment, Talent Acquisition',
      isVerified: true, emailVerified: true,
    },
  })

  const recruiter2 = await db.user.create({
    data: {
      email: 'careers@infosys.com', password: 'demo123', name: 'Infosys Recruitment',
      role: 'RECRUITER', company: 'Infosys', designation: 'Campus Recruiter',
      location: 'Pune', skills: 'Campus Hiring, Technical Assessment',
      isVerified: true, emailVerified: true,
    },
  })

  console.log(`  Created ${await db.user.count()} users\n`)

  // 3. Jobs
  console.log('Creating jobs...')
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const jobs = []
  const jobData = [
    { title: 'Software Developer', company: 'TCS', location: 'Pune', type: 'FULL_TIME', salaryMin: 3.5, salaryMax: 5, skills: 'Java, React, SQL', exp: '0-2 years', postedBy: recruiter1.id },
    { title: 'Frontend Developer', company: 'Infosys', location: 'Hyderabad', type: 'FULL_TIME', salaryMin: 4, salaryMax: 6, skills: 'React, TypeScript, CSS', exp: '1-3 years', postedBy: recruiter2.id },
    { title: 'Backend Engineer', company: 'TCS', location: 'Mumbai', type: 'FULL_TIME', salaryMin: 5, salaryMax: 8, skills: 'Node.js, Python, MongoDB', exp: '2-4 years', postedBy: recruiter1.id },
    { title: 'Data Analyst Intern', company: 'Infosys', location: 'Pune', type: 'INTERNSHIP', salaryMin: 15000, salaryMax: 20000, skills: 'Python, SQL, Excel', exp: 'Fresher', postedBy: recruiter2.id },
    { title: 'DevOps Engineer', company: 'TCS', location: 'Bangalore', type: 'FULL_TIME', salaryMin: 6, salaryMax: 10, skills: 'Docker, Kubernetes, AWS', exp: '3-5 years', postedBy: recruiter1.id },
    { title: 'React Native Developer', company: 'Persistent Systems', location: 'Pune', type: 'FULL_TIME', salaryMin: 5, salaryMax: 8, skills: 'React Native, JavaScript, Redux', exp: '1-3 years', postedBy: recruiter1.id },
    { title: 'Machine Learning Intern', company: 'TCS', location: 'Chennai', type: 'INTERNSHIP', salaryMin: 20000, salaryMax: 25000, skills: 'Python, TensorFlow, ML', exp: 'Fresher', postedBy: recruiter1.id },
    { title: 'Cloud Engineer', company: 'Infosys', location: 'Pune', type: 'FULL_TIME', salaryMin: 7, salaryMax: 12, skills: 'AWS, Azure, Terraform', exp: '3-5 years', postedBy: recruiter2.id },
    { title: 'UI/UX Designer', company: 'Persistent Systems', location: 'Mumbai', type: 'FULL_TIME', salaryMin: 4, salaryMax: 7, skills: 'Figma, Adobe XD, CSS', exp: '1-3 years', postedBy: recruiter1.id },
    { title: 'Embedded Systems Intern', company: 'Wipro', location: 'Bangalore', type: 'INTERNSHIP', salaryMin: 10000, salaryMax: 15000, skills: 'C, C++, Arduino', exp: 'Fresher', postedBy: recruiter2.id },
  ]

  for (const j of jobData) {
    jobs.push(await db.job.create({
      data: {
        title: j.title, company: j.company, location: j.location, type: j.type,
        salaryMin: j.salaryMin, salaryMax: j.salaryMax,
        description: `We are looking for a ${j.title} to join our team at ${j.company}.`,
        requirements: `${j.skills}. ${j.exp} experience required.`,
        skills: j.skills, experienceRequired: j.exp,
        postedById: j.postedBy, deadline: futureDate, status: 'OPEN', applicantsCount: Math.floor(Math.random() * 20),
      },
    }))
  }
  console.log(`  Created ${jobs.length} jobs\n`)

  // 4. Applications
  console.log('Creating applications...')
  const appStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'SHORTLISTED']
  for (let i = 0; i < 15; i++) {
    const student = students[i % students.length]
    const job = jobs[i % jobs.length]
    const exists = await db.application.findUnique({ where: { userId_jobId: { userId: student.id, jobId: job.id } } })
    if (!exists) {
      await db.application.create({
        data: {
          userId: student.id, jobId: job.id,
          status: appStatuses[i % appStatuses.length],
          coverLetter: `I am interested in the ${job.title} position at ${job.company}.`,
        },
      })
      if (i % 3 === 0) await db.job.update({ where: { id: job.id }, data: { applicantsCount: { increment: 1 } } })
    }
  }
  console.log('  Created applications\n')

  // 5. Mentorships
  console.log('Creating mentorships...')
  const mentors = [alumni1, alumni2, alumni3]
  const mentorshipStatuses = ['ACCEPTED', 'PENDING', 'COMPLETED']
  for (let i = 0; i < 5; i++) {
    await db.mentorship.create({
      data: {
        mentorId: mentors[i % mentors.length].id,
        menteeId: students[i % students.length].id,
        date: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        timeSlot: ['10:00 AM', '2:00 PM', '4:00 PM', '11:00 AM', '3:00 PM'][i],
        duration: 30,
        status: mentorshipStatuses[i % mentorshipStatuses.length],
        topic: ['Career Guidance', 'Interview Prep', 'Resume Review', 'Tech Skills', 'Job Search'][i],
        meetingLink: i < 2 ? 'https://meet.google.com/abc-defg-hij' : null,
        mentorName: mentors[i % mentors.length].name,
        menteeName: students[i % students.length].name,
      },
    })
  }
  console.log('  Created mentorships\n')

  // 6. Events
  console.log('Creating events...')
  const events = []
  const eventData = [
    { title: 'Tech Fest 2025', description: 'Annual technical festival with workshops and competitions.', type: 'WORKSHOP', date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), organizerId: admin.id },
    { title: 'Placement Drive - TCS', description: 'TCS campus recruitment drive for final year students.', type: 'PLACEMENT_DRIVE', date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), organizerId: placement.id },
    { title: 'Alumni Meet 2025', description: 'Annual alumni reunion and networking event.', type: 'MEETUP', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), organizerId: admin.id },
  ]
  for (const e of eventData) {
    events.push(await db.event.create({
      data: { ...e, maxAttendees: 200, currentAttendees: Math.floor(Math.random() * 80), isFeatured: true, organizationId: jjmcoe.id },
    }))
  }
  console.log('  Created events\n')

  // 7. Event Registrations
  console.log('Creating event registrations...')
  for (const event of events) {
    for (let i = 0; i < 5; i++) {
      const student = students[i]
      const exists = await db.eventRegistration.findUnique({ where: { userId_eventId: { userId: student.id, eventId: event.id } } })
      if (!exists) {
        await db.eventRegistration.create({ data: { userId: student.id, eventId: event.id, status: 'REGISTERED' } })
      }
    }
  }
  console.log('  Created registrations\n')

  // 8. Notifications
  console.log('Creating notifications...')
  const notifData = [
    { userId: students[0].id, title: 'Application Update', message: 'Your application to TCS has been shortlisted.', type: 'APPLICATION' },
    { userId: students[0].id, title: 'New Job Posted', message: 'A new job matching your skills has been posted.', type: 'JOB' },
    { userId: students[1].id, title: 'Event Reminder', message: 'Tech Fest 2025 starts in 2 days.', type: 'EVENT' },
    { userId: alumni1.id, title: 'Mentorship Request', message: 'Aditya Shinde requested a mentorship session.', type: 'MENTORSHIP' },
    { userId: admin.id, title: 'New Registration', message: '10 new students registered today.', type: 'INFO' },
    { userId: recruiter1.id, title: 'New Applications', message: '5 new applications received for Software Developer.', type: 'APPLICATION' },
    { userId: students[2].id, title: 'Certificate Issued', message: 'Workshop participation certificate has been issued.', type: 'CERTIFICATE' },
    { userId: placement.id, title: 'Placement Update', message: '3 students placed this week.', type: 'PLACEMENT' },
  ]
  for (const n of notifData) {
    await db.notification.create({ data: n })
  }
  console.log('  Created notifications\n')

  // 9. Payments
  console.log('Creating payments...')
  await db.payment.create({ data: { userId: students[0].id, amount: 500, type: 'EVENT', description: 'Tech Fest Registration', status: 'COMPLETED', razorpayId: 'pay_demo_1' } })
  await db.payment.create({ data: { userId: students[1].id, amount: 200, type: 'DONATION', description: 'Alumni Fund Donation', status: 'COMPLETED', razorpayId: 'pay_demo_2' } })
  console.log('  Created payments\n')

  // 10. Certificates
  console.log('Creating certificates...')
  const crypto = await import('crypto')
  for (let i = 0; i < 3; i++) {
    const hash = crypto.createHash('sha256').update(`cert-${i}-${Date.now()}`).digest('hex')
    await db.certificate.create({
      data: {
        userId: students[i].id, title: ['Workshop Participation', 'Hackathon Winner', 'Internship Completion'][i],
        type: 'WORKSHOP', description: `Certificate for ${['Tech Fest Workshop', 'Code-a-thon 2025', 'TCS Summer Intern'][i]}`,
        certificateHash: hash, txHash: '0x' + crypto.randomBytes(32).toString('hex'),
        issuedBy: 'JJMCOE Placement Cell',
      },
    })
  }
  console.log('  Created certificates\n')

  // 11. Analytics
  console.log('Creating analytics...')
  const analyticsData = [
    { metric: 'total_users', value: 20, label: 'Total Users' },
    { metric: 'total_jobs', value: 10, label: 'Total Jobs' },
    { metric: 'total_applications', value: 15, label: 'Total Applications' },
    { metric: 'placement_rate', value: 78, label: 'Placement Rate %' },
    { metric: 'avg_package', value: 450000, label: 'Avg Package (INR)' },
    { metric: 'highest_package', value: 1200000, label: 'Highest Package (INR)' },
  ]
  for (const a of analyticsData) {
    await db.analytics.create({ data: a })
  }
  console.log('  Created analytics\n')

  // Print credentials
  console.log('\n========================================')
  console.log('  SEEDING COMPLETE - TEST CREDENTIALS')
  console.log('========================================\n')
  console.log('ADMIN:')
  console.log('  Email: admin@jjmcoe.ac.in')
  console.log('  Password: admin123\n')
  console.log('DEPARTMENT ADMINS:')
  console.log('  cseadmin@jjmcoe.ac.in / cse123')
  console.log('  itadmin@jjmcoe.ac.in / it123')
  console.log('  aidsadmin@jjmcoe.ac.in / aids123')
  console.log('  entcadmin@jjmcoe.ac.in / entc123')
  console.log('  mechadmin@jjmcoe.ac.in / mech123')
  console.log('  civiladmin@jjmcoe.ac.in / civil123')
  console.log('  mcaadmin@jjmcoe.ac.in / mca123\n')
  console.log('PLACEMENT OFFICER:')
  console.log('  Email: placement@jjmcoe.ac.in')
  console.log('  Password: place123\n')
  console.log('ALUMNI (5 accounts, all password: demo123):')
  console.log('  rahul.pawar@jjmcoe.ac.in')
  console.log('  priya.patil@jjmcoe.ac.in')
  console.log('  sachin.kulkarni@jjmcoe.ac.in')
  console.log('  megha.joshi@jjmcoe.ac.in')
  console.log('  amol.mane@jjmcoe.ac.in\n')
  console.log('STUDENTS (10 accounts, all password: demo123):')
  console.log('  aditya.shinde@jjmcoe.ac.in')
  console.log('  sneha.kulkarni@jjmcoe.ac.in')
  console.log('  rohan.jadhav@jjmcoe.ac.in')
  console.log('  pooja.gaikwad@jjmcoe.ac.in')
  console.log('  akash.patil@jjmcoe.ac.in')
  console.log('  neha.chavan@jjmcoe.ac.in')
  console.log('  saurabh.desai@jjmcoe.ac.in')
  console.log('  kavita.raut@jjmcoe.ac.in')
  console.log('  vikram.more@jjmcoe.ac.in')
  console.log('  swati.bhosle@jjmcoe.ac.in\n')
  console.log('RECRUITERS (all password: demo123):')
  console.log('  hr@tcs.com')
  console.log('  careers@infosys.com\n')
  console.log('========================================')

  await db.$disconnect()
}

seed().catch((e) => { console.error(e); process.exit(1) })
