import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database with comprehensive data...\n')

  // ─── 1. Delete all existing data in reverse dependency order ───
  console.log('🗑️  Cleaning existing data...')
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
  console.log('   ✅ All existing data deleted\n')

  // ─── 2. Create Organizations ───
  console.log('🏢 Creating organizations...')
  const orgJJMCOE = await db.organization.create({
    data: {
      name: 'Dr. J.J. Magdum College of Engineering, Jaysingpur',
      code: 'JJMCOE',
      logo: '/logos/jjmcoe.png',
      website: 'https://jjmcoe.ac.in',
      city: 'Jaysingpur',
      state: 'Maharashtra',
      isActive: true,
    },
  })

  const orgPICT = await db.organization.create({
    data: {
      name: 'Pune Institute of Computer Technology',
      code: 'PICT',
      logo: '/logos/pict.png',
      website: 'https://pict.edu',
      city: 'Pune',
      state: 'Maharashtra',
      isActive: true,
    },
  })
  console.log(`   ✅ Created ${await db.organization.count()} organizations\n`)

  // ─── 3. Create JJMCOE Users (existing users) ───
  console.log('👥 Creating JJMCOE users...')
  const admin = await db.user.create({
    data: {
      email: 'admin@alumniportal.com',
      password: 'admin',
      name: 'Dr. Rajesh Kumar',
      role: 'ADMIN',
      department: 'Administration',
      phone: '+91 9876543210',
      bio: 'Dean of Student Affairs overseeing the alumni portal initiative.',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const placement = await db.user.create({
    data: {
      email: 'placement@alumniportal.com',
      password: 'placement',
      name: 'Prof. Anita Deshmukh',
      role: 'PLACEMENT_CELL',
      department: 'Training & Placement',
      phone: '+91 9876543211',
      bio: 'Placement Officer with 10+ years of experience in campus recruitment.',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const student1 = await db.user.create({
    data: {
      email: 'aditya@student.edu',
      password: 'demo',
      name: 'Aditya Gudimani',
      role: 'STUDENT',
      department: 'Information Technology (IT)',
      batch: '2024-2028',
      graduationYear: 2028,
      phone: '+91 9876543212',
      bio: 'Passionate full-stack developer with interest in AI/ML. Active in coding competitions and open source.',
      location: 'Jaysingpur, Maharashtra',
      skills: '["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "Python", "MongoDB", "Git"]',
      gpa: 8.7,
      linkedinUrl: 'https://linkedin.com/in/aditya',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const student2 = await db.user.create({
    data: {
      email: 'somnath@student.edu',
      password: 'demo',
      name: 'Somnath Jadhav',
      role: 'STUDENT',
      department: 'Information Technology (IT)',
      batch: '2024-2028',
      graduationYear: 2028,
      phone: '+91 9876543213',
      bio: 'Data science enthusiast with strong analytical skills. Interested in machine learning and NLP.',
      location: 'Kolhapur, Maharashtra',
      skills: '["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow", "Pandas", "Flask"]',
      gpa: 8.9,
      linkedinUrl: 'https://linkedin.com/in/somnath',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const student3 = await db.user.create({
    data: {
      email: 'prathamesh@student.edu',
      password: 'demo',
      name: 'Prathamesh Kadam',
      role: 'STUDENT',
      department: 'Computer Science and Engineering (CSE)',
      batch: '2024-2028',
      graduationYear: 2028,
      phone: '+91 9876543214',
      bio: 'Backend developer specializing in cloud technologies and DevOps practices.',
      location: 'Sangli, Maharashtra',
      skills: '["Java", "Spring Boot", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Linux"]',
      gpa: 8.3,
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const alumni1 = await db.user.create({
    data: {
      email: 'rahul@alumni.edu',
      password: 'demo',
      name: 'Rahul Patil',
      role: 'ALUMNI',
      department: 'Information Technology (IT)',
      batch: '2018-2022',
      graduationYear: 2022,
      phone: '+91 9876543215',
      bio: 'Senior Software Engineer at TCS with expertise in cloud-native applications. Passionate about mentoring juniors.',
      company: 'Tata Consultancy Services',
      designation: 'Senior Software Engineer',
      experience: '3 years',
      location: 'Pune, Maharashtra',
      skills: '["Java", "Spring Boot", "AWS", "Microservices", "Angular", "Docker"]',
      linkedinUrl: 'https://linkedin.com/in/rahul',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const alumni2 = await db.user.create({
    data: {
      email: 'priya@alumni.edu',
      password: 'demo',
      name: 'Priya Sharma',
      role: 'ALUMNI',
      department: 'Computer Science and Engineering (CSE)',
      batch: '2019-2023',
      graduationYear: 2023,
      phone: '+91 9876543216',
      bio: 'Data Scientist at Infosys working on NLP and computer vision projects. Active open-source contributor.',
      company: 'Infosys',
      designation: 'Data Scientist',
      experience: '2 years',
      location: 'Bangalore, Karnataka',
      skills: '["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "SQL", "AWS"]',
      linkedinUrl: 'https://linkedin.com/in/priya',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const alumni3 = await db.user.create({
    data: {
      email: 'vikram@alumni.edu',
      password: 'demo',
      name: 'Vikram Mehta',
      role: 'ALUMNI',
      department: 'Information Technology (IT)',
      batch: '2017-2021',
      graduationYear: 2021,
      phone: '+91 9876543217',
      bio: 'Product Manager at Razorpay. Previously co-founded a fintech startup.',
      company: 'Razorpay',
      designation: 'Product Manager',
      experience: '4 years',
      location: 'Bangalore, Karnataka',
      skills: '["Product Management", "Agile", "SQL", "Data Analysis", "UX Design", "Strategy"]',
      linkedinUrl: 'https://linkedin.com/in/vikram',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const recruiter1 = await db.user.create({
    data: {
      email: 'hr@tcs.com',
      password: 'demo',
      name: 'Meghna Iyer',
      role: 'RECRUITER',
      department: 'Human Resources',
      phone: '+91 9876543218',
      bio: 'Talent Acquisition Specialist at TCS. Looking for talented engineering graduates.',
      company: 'Tata Consultancy Services',
      designation: 'Talent Acquisition Specialist',
      location: 'Mumbai, Maharashtra',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  const recruiter2 = await db.user.create({
    data: {
      email: 'careers@infosys.com',
      password: 'demo',
      name: 'Arun Nair',
      role: 'RECRUITER',
      department: 'Recruitment',
      phone: '+91 9876543219',
      bio: 'Campus Recruiter at Infosys focused on hiring top engineering talent.',
      company: 'Infosys',
      designation: 'Campus Recruiter',
      location: 'Pune, Maharashtra',
      isVerified: true,
      organizationId: orgJJMCOE.id,
    },
  })

  // ─── 4. Create PICT Users (2 students + 2 alumni) ───
  console.log('👥 Creating PICT users...')
  const pictStudent1 = await db.user.create({
    data: {
      email: 'ananya@pict.edu',
      password: 'demo',
      name: 'Ananya Kulkarni',
      role: 'STUDENT',
      department: 'Computer Engineering',
      batch: '2023-2027',
      graduationYear: 2027,
      phone: '+91 9876543220',
      bio: 'Full-stack developer and competitive programmer. Active in hackathons and open-source contributions. President of the coding club.',
      location: 'Pune, Maharashtra',
      skills: '["C++", "JavaScript", "React", "Node.js", "PostgreSQL", "GraphQL", "Docker", "TypeScript"]',
      gpa: 9.1,
      linkedinUrl: 'https://linkedin.com/in/ananya-kulkarni',
      isVerified: true,
      organizationId: orgPICT.id,
    },
  })

  const pictStudent2 = await db.user.create({
    data: {
      email: 'rohan@pict.edu',
      password: 'demo',
      name: 'Rohan Deshpande',
      role: 'STUDENT',
      department: 'Information Technology (IT)',
      batch: '2023-2027',
      graduationYear: 2027,
      phone: '+91 9876543221',
      bio: 'Cybersecurity enthusiast and ethical hacker. CTF player and winner of multiple national-level competitions.',
      location: 'Pune, Maharashtra',
      skills: '["Python", "Network Security", "Cryptography", "Linux", "Kali Linux", "Wireshark", "Bash", "Go"]',
      gpa: 8.5,
      linkedinUrl: 'https://linkedin.com/in/rohan-deshpande',
      isVerified: true,
      organizationId: orgPICT.id,
    },
  })

  const pictAlumni1 = await db.user.create({
    data: {
      email: 'neha@pict-alumni.edu',
      password: 'demo',
      name: 'Neha Joshi',
      role: 'ALUMNI',
      department: 'Computer Engineering',
      batch: '2017-2021',
      graduationYear: 2021,
      phone: '+91 9876543222',
      bio: 'Engineering Manager at Google leading the Chrome DevTools team. Open-source advocate and tech speaker at international conferences.',
      company: 'Google',
      designation: 'Engineering Manager',
      experience: '5 years',
      location: 'Mountain View, California',
      skills: '["C++", "JavaScript", "Leadership", "System Design", "DevTools", "Chromium", "Performance Optimization"]',
      linkedinUrl: 'https://linkedin.com/in/neha-joshi',
      isVerified: true,
      organizationId: orgPICT.id,
    },
  })

  const pictAlumni2 = await db.user.create({
    data: {
      email: 'siddharth@pict-alumni.edu',
      password: 'demo',
      name: 'Siddharth Rane',
      role: 'ALUMNI',
      department: 'Information Technology (IT)',
      batch: '2019-2023',
      graduationYear: 2023,
      phone: '+91 9876543223',
      bio: 'Machine Learning Engineer at Microsoft Research India. Published researcher in NeurIPS and ICML. Passionate about mentoring.',
      company: 'Microsoft',
      designation: 'ML Engineer',
      experience: '2 years',
      location: 'Bangalore, Karnataka',
      skills: '["Python", "PyTorch", "Deep Learning", "NLP", "Research", "CUDA", "Distributed Systems"]',
      linkedinUrl: 'https://linkedin.com/in/siddharth-rane',
      isVerified: true,
      organizationId: orgPICT.id,
    },
  })
  console.log(`   ✅ Created ${await db.user.count()} users (${await db.user.count({ where: { organizationId: orgJJMCOE.id } })} JJMCOE + ${await db.user.count({ where: { organizationId: orgPICT.id } })} PICT)\n`)

  // ─── 5. Create Jobs (6 existing) ───
  console.log('💼 Creating jobs...')
  const job1 = await db.job.create({
    data: {
      title: 'Full Stack Developer',
      company: 'Tata Consultancy Services',
      location: 'Pune, Maharashtra',
      type: 'FULL_TIME',
      salaryMin: 600000,
      salaryMax: 1200000,
      currency: 'INR',
      description: 'We are looking for a motivated Full Stack Developer to join our dynamic team. You will work on building scalable web applications using modern technologies including React, Node.js, and cloud services. The ideal candidate should be passionate about clean code and continuous learning.',
      requirements: 'B.Tech/B.E. in CS/IT with strong programming fundamentals. Experience with React, Node.js, and databases. Knowledge of cloud platforms (AWS/GCP/Azure) is a plus.',
      skills: '["React", "Node.js", "TypeScript", "MongoDB", "AWS", "Git"]',
      experienceRequired: '0-2 years',
      postedById: recruiter1.id,
      status: 'OPEN',
      deadline: new Date('2026-09-30'),
      applicantsCount: 0,
    },
  })

  const job2 = await db.job.create({
    data: {
      title: 'Data Science Intern',
      company: 'Infosys',
      location: 'Bangalore, Karnataka',
      type: 'INTERNSHIP',
      salaryMin: 25000,
      salaryMax: 40000,
      currency: 'INR',
      description: 'Join our Data Science team for a 6-month internship program. You will work on real-world projects involving machine learning, data analysis, and NLP. This is an excellent opportunity to kickstart your data science career with mentorship from senior data scientists.',
      requirements: 'Pursuing B.Tech/M.Tech in CS/IT/Statistics. Strong Python programming skills. Knowledge of ML libraries (scikit-learn, TensorFlow). Good analytical and problem-solving abilities.',
      skills: '["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow", "Pandas"]',
      experienceRequired: '0-1 years',
      postedById: recruiter2.id,
      status: 'OPEN',
      deadline: new Date('2026-08-31'),
      applicantsCount: 0,
    },
  })

  const job3 = await db.job.create({
    data: {
      title: 'Cloud Engineer',
      company: 'Tata Consultancy Services',
      location: 'Mumbai, Maharashtra',
      type: 'FULL_TIME',
      salaryMin: 800000,
      salaryMax: 1500000,
      currency: 'INR',
      description: 'Looking for a Cloud Engineer to design, deploy, and manage cloud infrastructure. You will work with AWS/Azure services, implement CI/CD pipelines, and ensure system reliability and scalability for enterprise clients.',
      requirements: 'B.Tech in CS/IT with cloud certification (AWS/Azure/GCP). Experience with Docker, Kubernetes, and IaC tools. Strong understanding of networking and security concepts.',
      skills: '["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Python"]',
      experienceRequired: '1-3 years',
      postedById: recruiter1.id,
      status: 'OPEN',
      deadline: new Date('2026-10-15'),
      applicantsCount: 0,
    },
  })

  const job4 = await db.job.create({
    data: {
      title: 'Frontend Developer Intern',
      company: 'Persistent Systems',
      location: 'Pune, Maharashtra',
      type: 'INTERNSHIP',
      salaryMin: 20000,
      salaryMax: 35000,
      currency: 'INR',
      description: '3-month internship for aspiring frontend developers. Work with React, TypeScript, and modern CSS to build beautiful, responsive user interfaces for enterprise applications used by Fortune 500 companies.',
      requirements: 'B.Tech in CS/IT (2nd/3rd year). Strong HTML, CSS, and JavaScript fundamentals. Knowledge of React is a plus. Eye for design and attention to detail.',
      skills: '["React", "TypeScript", "Tailwind CSS", "HTML", "CSS", "JavaScript"]',
      experienceRequired: '0 years',
      postedById: recruiter1.id,
      status: 'OPEN',
      deadline: new Date('2026-09-15'),
      applicantsCount: 0,
    },
  })

  const job5 = await db.job.create({
    data: {
      title: 'Backend Developer',
      company: 'Infosys',
      location: 'Hyderabad, Telangana',
      type: 'FULL_TIME',
      salaryMin: 700000,
      salaryMax: 1300000,
      currency: 'INR',
      description: 'Join our backend engineering team to build robust, scalable APIs and microservices. Work with Java/Spring Boot, PostgreSQL, and cloud services to power enterprise applications serving millions of users.',
      requirements: 'B.Tech/M.Tech in CS/IT. Strong Java/Spring Boot skills. Experience with RESTful APIs and databases. Knowledge of message queues and caching is a bonus.',
      skills: '["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Redis", "Docker"]',
      experienceRequired: '1-3 years',
      postedById: recruiter2.id,
      status: 'OPEN',
      deadline: new Date('2026-10-31'),
      applicantsCount: 0,
    },
  })

  const job6 = await db.job.create({
    data: {
      title: 'DevOps Engineer',
      company: 'Razorpay',
      location: 'Bangalore, Karnataka',
      type: 'FULL_TIME',
      salaryMin: 1200000,
      salaryMax: 2200000,
      currency: 'INR',
      description: 'Build and maintain the infrastructure that powers millions of transactions daily. Work with cutting-edge tools and practices in a fast-paced fintech environment. Opportunity to work on complex distributed systems at scale.',
      requirements: 'B.Tech in CS/IT. Expert in Docker, Kubernetes, CI/CD pipelines. Strong Linux and networking skills. Experience with monitoring tools (Prometheus, Grafana).',
      skills: '["Kubernetes", "Docker", "CI/CD", "AWS", "Terraform", "Prometheus"]',
      experienceRequired: '2-4 years',
      postedById: recruiter1.id,
      status: 'OPEN',
      deadline: new Date('2026-11-30'),
      applicantsCount: 0,
    },
  })
  console.log(`   ✅ Created ${await db.job.count()} jobs\n`)

  // ─── 6. Create Applications (5 existing + 2 PICT) ───
  console.log('📋 Creating applications...')
  await db.application.createMany({
    data: [
      {
        userId: student1.id,
        jobId: job1.id,
        status: 'PENDING',
        coverLetter: 'I am excited to apply for the Full Stack Developer position. My experience with React, Node.js, and cloud services makes me a strong candidate for this role.',
      },
      {
        userId: student1.id,
        jobId: job4.id,
        status: 'ACCEPTED',
        coverLetter: 'I would love to intern as a Frontend Developer. I have built multiple projects using React and Tailwind CSS and am eager to contribute to enterprise applications.',
      },
      {
        userId: student2.id,
        jobId: job2.id,
        status: 'PENDING',
        coverLetter: 'As a data science enthusiast, this internship at Infosys is perfect for me. My skills in Python and ML align well with the requirements.',
      },
      {
        userId: student3.id,
        jobId: job3.id,
        status: 'REVIEWED',
        coverLetter: 'My expertise in cloud technologies and DevOps practices makes me an ideal fit for the Cloud Engineer role.',
      },
      {
        userId: student3.id,
        jobId: job5.id,
        status: 'PENDING',
        coverLetter: 'I have strong Java/Spring Boot skills and have built multiple backend applications during my coursework.',
      },
      {
        userId: pictStudent1.id,
        jobId: job1.id,
        status: 'PENDING',
        coverLetter: 'As a Computer Engineering student at PICT with a 9.1 GPA and strong full-stack skills, I believe I can contribute meaningfully to TCS. I have won 3 hackathons and contributed to 2 open-source projects.',
      },
      {
        userId: pictStudent2.id,
        jobId: job3.id,
        status: 'PENDING',
        coverLetter: 'My specialization in cybersecurity and cloud infrastructure aligns perfectly with the Cloud Engineer role. I hold CompTIA Security+ certification and have hands-on experience with AWS.',
      },
    ],
  })

  // Update applicant counts
  await db.job.update({ where: { id: job1.id }, data: { applicantsCount: 2 } })
  await db.job.update({ where: { id: job2.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job3.id }, data: { applicantsCount: 2 } })
  await db.job.update({ where: { id: job4.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job5.id }, data: { applicantsCount: 1 } })
  console.log(`   ✅ Created ${await db.application.count()} applications\n`)

  // ─── 7. Create Mentorships (3 existing + 1 new) ───
  console.log('🤝 Creating mentorships...')
  await db.mentorship.createMany({
    data: [
      {
        mentorId: alumni1.id,
        menteeId: student1.id,
        date: new Date('2026-08-10'),
        timeSlot: '10:00 AM - 10:30 AM',
        duration: 30,
        status: 'ACCEPTED',
        topic: 'Career guidance in full-stack development',
        mentorName: alumni1.name,
        menteeName: student1.name,
      },
      {
        mentorId: alumni2.id,
        menteeId: student2.id,
        date: new Date('2026-08-12'),
        timeSlot: '3:00 PM - 3:30 PM',
        duration: 30,
        status: 'PENDING',
        topic: 'Getting started with data science career',
        mentorName: alumni2.name,
        menteeName: student2.name,
      },
      {
        mentorId: alumni3.id,
        menteeId: student3.id,
        date: new Date('2026-08-15'),
        timeSlot: '11:00 AM - 11:30 AM',
        duration: 30,
        status: 'ACCEPTED',
        topic: 'Product management as a career path',
        mentorName: alumni3.name,
        menteeName: student3.name,
      },
      {
        mentorId: pictAlumni1.id,
        menteeId: pictStudent1.id,
        date: new Date('2026-09-01'),
        timeSlot: '6:00 PM - 6:45 PM',
        duration: 45,
        status: 'PENDING',
        topic: 'Breaking into big tech - Google interview preparation and system design',
        mentorName: pictAlumni1.name,
        menteeName: pictStudent1.name,
      },
    ],
  })
  console.log(`   ✅ Created ${await db.mentorship.count()} mentorships\n`)

  // ─── 8. Create Events (5 existing + 2 new = 7 total) ───
  console.log('📅 Creating events...')
  const event1 = await db.event.create({
    data: {
      title: 'AI & Machine Learning Workshop',
      description: 'A hands-on workshop covering fundamental AI/ML concepts, practical implementations using Python and TensorFlow, and real-world case studies. Perfect for students looking to break into AI careers.',
      date: new Date('2026-08-20'),
      time: '10:00 AM - 4:00 PM',
      location: 'IT Seminar Hall, Block A',
      type: 'WORKSHOP',
      organizerId: placement.id,
      maxAttendees: 100,
      currentAttendees: 67,
      isFeatured: true,
      price: 0,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  const event2 = await db.event.create({
    data: {
      title: 'TCS Campus Recruitment Drive 2026',
      description: 'Annual campus recruitment drive by TCS for final year students. Multiple positions available across technology domains. Pre-placement talk followed by online assessment and interviews.',
      date: new Date('2026-09-05'),
      time: '9:00 AM - 5:00 PM',
      location: 'Main Auditorium',
      type: 'CAMPUS_DRIVE',
      organizerId: placement.id,
      maxAttendees: 200,
      currentAttendees: 145,
      isFeatured: true,
      price: 0,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  const event3 = await db.event.create({
    data: {
      title: 'Alumni Connect: Industry Insights Panel',
      description: 'Join our distinguished alumni panel featuring professionals from TCS, Infosys, and Razorpay as they share career insights, industry trends, and tips for placement preparation.',
      date: new Date('2026-08-25'),
      time: '2:00 PM - 4:00 PM',
      location: 'Virtual (Zoom)',
      type: 'SEMINAR',
      organizerId: admin.id,
      maxAttendees: 150,
      currentAttendees: 89,
      isFeatured: true,
      price: 0,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  const event4 = await db.event.create({
    data: {
      title: 'Resume Building Masterclass',
      description: 'Learn how to craft an ATS-friendly resume that stands out. Topics include resume formatting, keyword optimization, highlighting achievements, and tailoring for specific roles.',
      date: new Date('2026-08-18'),
      time: '11:00 AM - 1:00 PM',
      location: 'IT Lab, Room 301',
      type: 'WORKSHOP',
      organizerId: placement.id,
      maxAttendees: 50,
      currentAttendees: 42,
      isFeatured: false,
      price: 0,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  const event5 = await db.event.create({
    data: {
      title: 'Web Development Bootcamp - Week 1',
      description: 'First week of our intensive 4-week web development bootcamp. Covering HTML, CSS, JavaScript fundamentals and introduction to React.',
      date: new Date('2026-08-15'),
      time: '10:00 AM - 1:00 PM',
      location: 'Computer Lab 2',
      type: 'WORKSHOP',
      organizerId: admin.id,
      maxAttendees: 40,
      currentAttendees: 38,
      isFeatured: false,
      price: 0,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  // New event 6: Paid workshop
  const event6 = await db.event.create({
    data: {
      title: 'Full-Stack Development with Next.js - Premium Workshop',
      description: 'An intensive 2-day premium workshop on building production-grade applications with Next.js 15, TypeScript, Prisma, and Tailwind CSS. Includes hands-on projects, code reviews, and a certificate of completion. Lunch and study materials included.',
      date: new Date('2026-09-20'),
      time: '9:00 AM - 5:00 PM',
      location: 'Main Seminar Hall',
      type: 'WORKSHOP',
      organizerId: admin.id,
      maxAttendees: 60,
      currentAttendees: 23,
      isFeatured: true,
      price: 499,
      currency: 'INR',
      organizationId: orgJJMCOE.id,
    },
  })

  // New event 7: Paid conference (PICT)
  const event7 = await db.event.create({
    data: {
      title: 'PICT Tech Summit 2026: AI & Future of Work',
      description: 'Annual flagship technology conference featuring keynotes from industry leaders at Google, Microsoft, and Amazon. Topics include Generative AI, quantum computing, and the future of software engineering. Includes networking lunch and swag kit.',
      date: new Date('2026-10-10'),
      time: '9:00 AM - 6:00 PM',
      location: 'PICT Convention Center, Pune',
      type: 'CONFERENCE',
      organizerId: admin.id,
      maxAttendees: 300,
      currentAttendees: 87,
      isFeatured: true,
      price: 999,
      currency: 'INR',
      organizationId: orgPICT.id,
    },
  })
  console.log(`   ✅ Created ${await db.event.count()} events (2 paid)\n`)

  // ─── 9. Create Event Registrations (12 total) ───
  console.log('🎟️  Creating event registrations...')
  await db.eventRegistration.createMany({
    data: [
      // Event 1: AI Workshop - JJMCOE students
      { userId: student1.id, eventId: event1.id, status: 'REGISTERED' },
      { userId: student2.id, eventId: event1.id, status: 'REGISTERED' },
      { userId: student3.id, eventId: event1.id, status: 'REGISTERED' },
      // Event 2: TCS Drive - JJMCOE students
      { userId: student1.id, eventId: event2.id, status: 'REGISTERED' },
      { userId: student3.id, eventId: event2.id, status: 'REGISTERED' },
      // Event 3: Alumni Panel - students + alumni
      { userId: student2.id, eventId: event3.id, status: 'REGISTERED' },
      { userId: alumni1.id, eventId: event3.id, status: 'REGISTERED' },
      // Event 4: Resume Masterclass
      { userId: student1.id, eventId: event4.id, status: 'REGISTERED' },
      // Event 6: Paid Next.js Workshop
      { userId: student1.id, eventId: event6.id, status: 'REGISTERED' },
      { userId: student2.id, eventId: event6.id, status: 'REGISTERED' },
      // Event 7: PICT Tech Summit - PICT users + JJMCOE users
      { userId: pictStudent1.id, eventId: event7.id, status: 'REGISTERED' },
      { userId: pictStudent2.id, eventId: event7.id, status: 'REGISTERED' },
    ],
  })
  console.log(`   ✅ Created ${await db.eventRegistration.count()} event registrations\n`)

  // ─── 10. Create Notifications (10 existing + more for PICT) ───
  console.log('🔔 Creating notifications...')
  await db.notification.createMany({
    data: [
      // Existing JJMCOE notifications
      { userId: student1.id, title: 'Application Accepted', message: 'Your application for Frontend Developer Intern at Persistent Systems has been accepted!', type: 'SUCCESS', isRead: false },
      { userId: student1.id, title: 'New Job Posted', message: 'TCS has posted a new Full Stack Developer position. Apply before September 30th!', type: 'INFO', isRead: false },
      { userId: student1.id, title: 'Mentorship Confirmed', message: 'Your mentorship session with Rahul Patil is confirmed for August 10 at 10:00 AM.', type: 'INFO', isRead: true },
      { userId: student2.id, title: 'Workshop Reminder', message: 'AI & ML Workshop is coming up on August 20. Do not forget to register!', type: 'REMINDER', isRead: false },
      { userId: student2.id, title: 'Mentorship Request Sent', message: 'Your mentorship request to Priya Sharma has been sent.', type: 'INFO', isRead: false },
      { userId: admin.id, title: 'New User Registered', message: 'A new student Aditya Gudimani has registered on the portal.', type: 'INFO', isRead: false },
      { userId: admin.id, title: 'Campus Drive Approved', message: 'TCS Campus Drive for September 5 has been approved.', type: 'SUCCESS', isRead: true },
      { userId: recruiter1.id, title: 'New Application', message: 'Aditya Gudimani has applied for the Full Stack Developer position.', type: 'INFO', isRead: false },
      { userId: recruiter1.id, title: 'Job Expiring Soon', message: 'Your job posting "Frontend Developer Intern" expires on September 15.', type: 'REMINDER', isRead: false },
      { userId: alumni1.id, title: 'Mentorship Request', message: 'Aditya Gudimani has requested a mentorship session with you.', type: 'INFO', isRead: true },
      // New PICT notifications
      { userId: pictStudent1.id, title: 'Welcome to AlumniNexus!', message: 'Welcome Ananya! Your PICT account has been verified. Explore jobs, events, and mentorship opportunities.', type: 'SUCCESS', isRead: false },
      { userId: pictStudent1.id, title: 'Mentorship Request Pending', message: 'Your mentorship request to Neha Joshi (Google) is awaiting a response.', type: 'INFO', isRead: false },
      { userId: pictStudent2.id, title: 'Welcome to AlumniNexus!', message: 'Welcome Rohan! Your PICT account has been verified. Start connecting with alumni and applying for positions.', type: 'SUCCESS', isRead: true },
      { userId: pictStudent2.id, title: 'Tech Summit Registration Open', message: 'PICT Tech Summit 2026 tickets are now available. Register early for INR 999!', type: 'INFO', isRead: false },
      { userId: pictAlumni1.id, title: 'Mentorship Request Received', message: 'Ananya Kulkarni has requested a mentorship session with you on breaking into big tech.', type: 'INFO', isRead: false },
      { userId: pictAlumni2.id, title: 'Alumni Profile Verified', message: 'Your PICT alumni profile has been verified. Students can now discover you for mentorship.', type: 'SUCCESS', isRead: true },
    ],
  })
  console.log(`   ✅ Created ${await db.notification.count()} notifications\n`)

  // ─── 11. Create Payments (8 total) ───
  console.log('💰 Creating payments...')
  await db.payment.createMany({
    data: [
      {
        userId: student1.id,
        amount: 499,
        currency: 'INR',
        type: 'EVENT',
        status: 'COMPLETED',
        razorpayId: 'pay_RzP1k2m3n4o5p6',
        razorpayOrderId: 'order_RzO1a2b3c4d5e6',
        description: 'Registration for Full-Stack Development with Next.js - Premium Workshop',
        referenceId: event6.id,
      },
      {
        userId: student2.id,
        amount: 499,
        currency: 'INR',
        type: 'EVENT',
        status: 'COMPLETED',
        razorpayId: 'pay_RzQ7x8y9z0a1b2',
        razorpayOrderId: 'order_RzP2f3g4h5i6j7',
        description: 'Registration for Full-Stack Development with Next.js - Premium Workshop',
        referenceId: event6.id,
      },
      {
        userId: pictStudent1.id,
        amount: 999,
        currency: 'INR',
        type: 'EVENT',
        status: 'COMPLETED',
        razorpayId: 'pay_RzR3c4d5e6f7g8',
        razorpayOrderId: 'order_RzQ8k9l0m1n2o3',
        description: 'Registration for PICT Tech Summit 2026: AI & Future of Work',
        referenceId: event7.id,
      },
      {
        userId: pictStudent2.id,
        amount: 999,
        currency: 'INR',
        type: 'EVENT',
        status: 'COMPLETED',
        razorpayId: 'pay_RzS9h0i1j2k3l4',
        razorpayOrderId: 'order_RzR4p5q6r7s8t9',
        description: 'Registration for PICT Tech Summit 2026: AI & Future of Work',
        referenceId: event7.id,
      },
      {
        userId: alumni1.id,
        amount: 2000,
        currency: 'INR',
        type: 'DONATION',
        status: 'COMPLETED',
        razorpayId: 'pay_RzT5m6n7o8p9q0',
        razorpayOrderId: 'order_RzS1u2v3w4x5y6',
        description: 'Alumni donation towards scholarship fund for underprivileged students',
      },
      {
        userId: alumni3.id,
        amount: 1500,
        currency: 'INR',
        type: 'DONATION',
        status: 'COMPLETED',
        razorpayId: 'pay_RzU1a2b3c4d5e6',
        razorpayOrderId: 'order_RzT7z8a9b0c1d2',
        description: 'Contribution towards alumni portal development and maintenance',
      },
      {
        userId: student3.id,
        amount: 999,
        currency: 'INR',
        type: 'EVENT',
        status: 'PENDING',
        description: 'Registration for PICT Tech Summit 2026: AI & Future of Work',
        referenceId: event7.id,
      },
      {
        userId: alumni2.id,
        amount: 2000,
        currency: 'INR',
        type: 'DONATION',
        status: 'PENDING',
        description: 'Pledged donation for 2026 annual alumni meet',
      },
    ],
  })
  console.log(`   ✅ Created ${await db.payment.count()} payments\n`)

  // ─── 12. Create Certificates (6 total with SHA-256 hashes) ───
  console.log('📜 Creating certificates...')
  const now = Date.now()
  const twoYearsFromNow = new Date(now + 2 * 365 * 24 * 60 * 60 * 1000)

  const certificatesData = [
    {
      userId: student1.id,
      title: 'Web Development Bootcamp Completion',
      type: 'COMPLETION',
      description: 'Successfully completed the 4-week intensive Web Development Bootcamp covering HTML, CSS, JavaScript, React, and Node.js with a capstone project.',
      issuedBy: 'JJMCOE Training & Placement Cell',
      expiresAt: null,
    },
    {
      userId: student2.id,
      title: 'AI & Machine Learning Workshop',
      type: 'WORKSHOP',
      description: 'Participated in the hands-on AI/ML workshop covering neural networks, TensorFlow, and real-world machine learning applications.',
      issuedBy: 'JJMCOE Department of IT',
      expiresAt: null,
    },
    {
      userId: student1.id,
      title: 'Mentorship Excellence Award',
      type: 'ACHIEVEMENT',
      description: 'Awarded for outstanding performance and active engagement in the alumni mentorship program. Completed 5 mentorship sessions with consistent ratings of 5/5.',
      issuedBy: 'JJMCOE Alumni Association',
      expiresAt: null,
    },
    {
      userId: student3.id,
      title: 'Cloud & DevOps Certification',
      type: 'WORKSHOP',
      description: 'Earned certification in cloud computing and DevOps practices including AWS, Docker, Kubernetes, and CI/CD pipeline configuration.',
      issuedBy: 'JJMCOE in collaboration with AWS Educate',
      expiresAt: twoYearsFromNow,
    },
    {
      userId: pictStudent1.id,
      title: 'Hackathon Champion - CodeStorm 2026',
      type: 'ACHIEVEMENT',
      description: 'First place winner of CodeStorm 2026 national hackathon. Built an AI-powered accessibility tool for visually impaired users. Selected from 500+ teams.',
      issuedBy: 'PICT Technical Council',
      expiresAt: null,
    },
    {
      userId: pictStudent1.id,
      title: 'Alumni Mentorship Program Completion',
      type: 'MENTORSHIP',
      description: 'Successfully completed the structured mentorship program under Neha Joshi (Engineering Manager, Google). Focused on system design, interview prep, and career strategy.',
      issuedBy: 'PICT Alumni Network',
      expiresAt: twoYearsFromNow,
    },
  ]

  for (const cert of certificatesData) {
    const hashData = `${cert.userId}-${cert.title}-${cert.type}-${now}`
    const certificateHash = crypto.createHash('sha256').update(hashData).digest('hex')
    const txHash = '0x' + crypto.randomBytes(32).toString('hex')

    await db.certificate.create({
      data: {
        userId: cert.userId,
        title: cert.title,
        type: cert.type,
        description: cert.description,
        certificateHash,
        txHash,
        issuedBy: cert.issuedBy,
        issuedAt: new Date(),
        expiresAt: cert.expiresAt,
        isVerified: true,
      },
    })
  }
  console.log(`   ✅ Created ${await db.certificate.count()} certificates (with SHA-256 hashes)\n`)

  // ─── Summary ───
  console.log('═══════════════════════════════════════════')
  console.log('          📊 SEED SUMMARY                     ')
  console.log('═══════════════════════════════════════════')
  console.log(`  Organizations:        ${await db.organization.count()}`)
  console.log(`  Users:                ${await db.user.count()} (${await db.user.count({ where: { organizationId: orgJJMCOE.id } })} JJMCOE, ${await db.user.count({ where: { organizationId: orgPICT.id } })} PICT)`)
  console.log(`  Jobs:                 ${await db.job.count()}`)
  console.log(`  Applications:         ${await db.application.count()}`)
  console.log(`  Mentorships:          ${await db.mentorship.count()}`)
  console.log(`  Events:               ${await db.event.count()} (2 paid: ₹499, ₹999)`)
  console.log(`  Event Registrations:  ${await db.eventRegistration.count()}`)
  console.log(`  Notifications:        ${await db.notification.count()}`)
  console.log(`  Payments:             ${await db.payment.count()} (${await db.payment.count({ where: { status: 'COMPLETED' } })} completed, ${await db.payment.count({ where: { status: 'PENDING' } })} pending)`)
  console.log(`  Certificates:         ${await db.certificate.count()} (all verified, with blockchain txHash)`)
  console.log('═══════════════════════════════════════════')
  console.log('✅ Seed completed successfully!\n')

  await db.$disconnect()
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
