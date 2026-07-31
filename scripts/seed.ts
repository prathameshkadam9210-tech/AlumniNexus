import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seed() {
  console.log('Seeding database...')

  await db.notification.deleteMany()
  await db.application.deleteMany()
  await db.mentorship.deleteMany()
  await db.event.deleteMany()
  await db.job.deleteMany()
  await db.analytics.deleteMany()
  await db.user.deleteMany()

  const admin = await db.user.create({
    data: { email: 'admin@alumniportal.com', password: 'admin', name: 'Dr. Rajesh Kumar', role: 'ADMIN', department: 'Administration', phone: '+91 9876543210', bio: 'Dean of Student Affairs overseeing the alumni portal initiative.', isVerified: true },
  })

  const placement = await db.user.create({
    data: { email: 'placement@alumniportal.com', password: 'placement', name: 'Prof. Anita Deshmukh', role: 'PLACEMENT_CELL', department: 'Training & Placement', phone: '+91 9876543211', bio: 'Placement Officer with 10+ years of experience in campus recruitment.', isVerified: true },
  })

  const student1 = await db.user.create({
    data: { email: 'aditya@student.edu', password: 'demo', name: 'Aditya Gudimani', role: 'STUDENT', department: 'Information Technology', batch: '2024-2028', graduationYear: 2028, phone: '+91 9876543212', bio: 'Passionate full-stack developer with interest in AI/ML. Active in coding competitions and open source.', location: 'Jaysingpur, Maharashtra', skills: '["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "Python", "MongoDB", "Git"]', gpa: 8.7, linkedinUrl: 'https://linkedin.com/in/aditya', isVerified: true },
  })

  const student2 = await db.user.create({
    data: { email: 'somnath@student.edu', password: 'demo', name: 'Somnath Jadhav', role: 'STUDENT', department: 'Information Technology', batch: '2024-2028', graduationYear: 2028, phone: '+91 9876543213', bio: 'Data science enthusiast with strong analytical skills. Interested in machine learning and NLP.', location: 'Kolhapur, Maharashtra', skills: '["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow", "Pandas", "Flask"]', gpa: 8.9, linkedinUrl: 'https://linkedin.com/in/somnath', isVerified: true },
  })

  const student3 = await db.user.create({
    data: { email: 'prathamesh@student.edu', password: 'demo', name: 'Prathamesh Kadam', role: 'STUDENT', department: 'Computer Science', batch: '2024-2028', graduationYear: 2028, phone: '+91 9876543214', bio: 'Backend developer specializing in cloud technologies and DevOps practices.', location: 'Sangli, Maharashtra', skills: '["Java", "Spring Boot", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Linux"]', gpa: 8.3, isVerified: true },
  })

  const alumni1 = await db.user.create({
    data: { email: 'rahul@alumni.edu', password: 'demo', name: 'Rahul Patil', role: 'ALUMNI', department: 'Information Technology', batch: '2018-2022', graduationYear: 2022, phone: '+91 9876543215', bio: 'Senior Software Engineer at TCS with expertise in cloud-native applications. Passionate about mentoring juniors.', company: 'Tata Consultancy Services', designation: 'Senior Software Engineer', experience: '3 years', location: 'Pune, Maharashtra', skills: '["Java", "Spring Boot", "AWS", "Microservices", "Angular", "Docker"]', linkedinUrl: 'https://linkedin.com/in/rahul', isVerified: true },
  })

  const alumni2 = await db.user.create({
    data: { email: 'priya@alumni.edu', password: 'demo', name: 'Priya Sharma', role: 'ALUMNI', department: 'Computer Science', batch: '2019-2023', graduationYear: 2023, phone: '+91 9876543216', bio: 'Data Scientist at Infosys working on NLP and computer vision projects. Active open-source contributor.', company: 'Infosys', designation: 'Data Scientist', experience: '2 years', location: 'Bangalore, Karnataka', skills: '["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "SQL", "AWS"]', linkedinUrl: 'https://linkedin.com/in/priya', isVerified: true },
  })

  const alumni3 = await db.user.create({
    data: { email: 'vikram@alumni.edu', password: 'demo', name: 'Vikram Mehta', role: 'ALUMNI', department: 'Information Technology', batch: '2017-2021', graduationYear: 2021, phone: '+91 9876543217', bio: 'Product Manager at Razorpay. Previously co-founded a fintech startup.', company: 'Razorpay', designation: 'Product Manager', experience: '4 years', location: 'Bangalore, Karnataka', skills: '["Product Management", "Agile", "SQL", "Data Analysis", "UX Design", "Strategy"]', linkedinUrl: 'https://linkedin.com/in/vikram', isVerified: true },
  })

  const recruiter1 = await db.user.create({
    data: { email: 'hr@tcs.com', password: 'demo', name: 'Meghna Iyer', role: 'RECRUITER', department: 'Human Resources', phone: '+91 9876543218', bio: 'Talent Acquisition Specialist at TCS. Looking for talented engineering graduates.', company: 'Tata Consultancy Services', designation: 'Talent Acquisition Specialist', location: 'Mumbai, Maharashtra', isVerified: true },
  })

  const recruiter2 = await db.user.create({
    data: { email: 'careers@infosys.com', password: 'demo', name: 'Arun Nair', role: 'RECRUITER', department: 'Recruitment', phone: '+91 9876543219', bio: 'Campus Recruiter at Infosys focused on hiring top engineering talent.', company: 'Infosys', designation: 'Campus Recruiter', location: 'Pune, Maharashtra', isVerified: true },
  })

  const job1 = await db.job.create({ data: { title: 'Full Stack Developer', company: 'Tata Consultancy Services', location: 'Pune, Maharashtra', type: 'FULL_TIME', salaryMin: 600000, salaryMax: 1200000, currency: 'INR', description: 'We are looking for a motivated Full Stack Developer to join our dynamic team. You will work on building scalable web applications using modern technologies including React, Node.js, and cloud services. The ideal candidate should be passionate about clean code and continuous learning.', requirements: 'B.Tech/B.E. in CS/IT with strong programming fundamentals. Experience with React, Node.js, and databases. Knowledge of cloud platforms (AWS/GCP/Azure) is a plus.', skills: '["React", "Node.js", "TypeScript", "MongoDB", "AWS", "Git"]', experienceRequired: '0-2 years', postedById: recruiter1.id, status: 'OPEN', deadline: new Date('2026-09-30'), applicantsCount: 0 } })

  const job2 = await db.job.create({ data: { title: 'Data Science Intern', company: 'Infosys', location: 'Bangalore, Karnataka', type: 'INTERNSHIP', salaryMin: 25000, salaryMax: 40000, currency: 'INR', description: 'Join our Data Science team for a 6-month internship program. You will work on real-world projects involving machine learning, data analysis, and NLP. This is an excellent opportunity to kickstart your data science career with mentorship from senior data scientists.', requirements: 'Pursuing B.Tech/M.Tech in CS/IT/Statistics. Strong Python programming skills. Knowledge of ML libraries (scikit-learn, TensorFlow). Good analytical and problem-solving abilities.', skills: '["Python", "Machine Learning", "Data Analysis", "SQL", "TensorFlow", "Pandas"]', experienceRequired: '0-1 years', postedById: recruiter2.id, status: 'OPEN', deadline: new Date('2026-08-31'), applicantsCount: 0 } })

  const job3 = await db.job.create({ data: { title: 'Cloud Engineer', company: 'Tata Consultancy Services', location: 'Mumbai, Maharashtra', type: 'FULL_TIME', salaryMin: 800000, salaryMax: 1500000, currency: 'INR', description: 'Looking for a Cloud Engineer to design, deploy, and manage cloud infrastructure. You will work with AWS/Azure services, implement CI/CD pipelines, and ensure system reliability and scalability for enterprise clients.', requirements: 'B.Tech in CS/IT with cloud certification (AWS/Azure/GCP). Experience with Docker, Kubernetes, and IaC tools. Strong understanding of networking and security concepts.', skills: '["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Python"]', experienceRequired: '1-3 years', postedById: recruiter1.id, status: 'OPEN', deadline: new Date('2026-10-15'), applicantsCount: 0 } })

  const job4 = await db.job.create({ data: { title: 'Frontend Developer Intern', company: 'Persistent Systems', location: 'Pune, Maharashtra', type: 'INTERNSHIP', salaryMin: 20000, salaryMax: 35000, currency: 'INR', description: '3-month internship for aspiring frontend developers. Work with React, TypeScript, and modern CSS to build beautiful, responsive user interfaces for enterprise applications used by Fortune 500 companies.', requirements: 'B.Tech in CS/IT (2nd/3rd year). Strong HTML, CSS, and JavaScript fundamentals. Knowledge of React is a plus. Eye for design and attention to detail.', skills: '["React", "TypeScript", "Tailwind CSS", "HTML", "CSS", "JavaScript"]', experienceRequired: '0 years', postedById: recruiter1.id, status: 'OPEN', deadline: new Date('2026-09-15'), applicantsCount: 0 } })

  const job5 = await db.job.create({ data: { title: 'Backend Developer', company: 'Infosys', location: 'Hyderabad, Telangana', type: 'FULL_TIME', salaryMin: 700000, salaryMax: 1300000, currency: 'INR', description: 'Join our backend engineering team to build robust, scalable APIs and microservices. Work with Java/Spring Boot, PostgreSQL, and cloud services to power enterprise applications serving millions of users.', requirements: 'B.Tech/M.Tech in CS/IT. Strong Java/Spring Boot skills. Experience with RESTful APIs and databases. Knowledge of message queues and caching is a bonus.', skills: '["Java", "Spring Boot", "PostgreSQL", "REST APIs", "Redis", "Docker"]', experienceRequired: '1-3 years', postedById: recruiter2.id, status: 'OPEN', deadline: new Date('2026-10-31'), applicantsCount: 0 } })

  const job6 = await db.job.create({ data: { title: 'DevOps Engineer', company: 'Razorpay', location: 'Bangalore, Karnataka', type: 'FULL_TIME', salaryMin: 1200000, salaryMax: 2200000, currency: 'INR', description: 'Build and maintain the infrastructure that powers millions of transactions daily. Work with cutting-edge tools and practices in a fast-paced fintech environment. Opportunity to work on complex distributed systems at scale.', requirements: 'B.Tech in CS/IT. Expert in Docker, Kubernetes, CI/CD pipelines. Strong Linux and networking skills. Experience with monitoring tools (Prometheus, Grafana).', skills: '["Kubernetes", "Docker", "CI/CD", "AWS", "Terraform", "Prometheus"]', experienceRequired: '2-4 years', postedById: recruiter1.id, status: 'OPEN', deadline: new Date('2026-11-30'), applicantsCount: 0 } })

  await db.application.createMany({
    data: [
      { userId: student1.id, jobId: job1.id, status: 'PENDING', coverLetter: 'I am excited to apply for the Full Stack Developer position. My experience with React, Node.js, and cloud services makes me a strong candidate for this role.' },
      { userId: student1.id, jobId: job4.id, status: 'ACCEPTED', coverLetter: 'I would love to intern as a Frontend Developer. I have built multiple projects using React and Tailwind CSS and am eager to contribute to enterprise applications.' },
      { userId: student2.id, jobId: job2.id, status: 'PENDING', coverLetter: 'As a data science enthusiast, this internship at Infosys is perfect for me. My skills in Python and ML align well with the requirements.' },
      { userId: student3.id, jobId: job3.id, status: 'REVIEWED', coverLetter: 'My expertise in cloud technologies and DevOps practices makes me an ideal fit for the Cloud Engineer role.' },
      { userId: student3.id, jobId: job5.id, status: 'PENDING', coverLetter: 'I have strong Java/Spring Boot skills and have built multiple backend applications during my coursework.' },
    ],
  })

  await db.job.update({ where: { id: job1.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job2.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job3.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job4.id }, data: { applicantsCount: 1 } })
  await db.job.update({ where: { id: job5.id }, data: { applicantsCount: 1 } })

  await db.mentorship.createMany({
    data: [
      { mentorId: alumni1.id, menteeId: student1.id, date: new Date('2026-08-10'), timeSlot: '10:00 AM - 10:30 AM', duration: 30, status: 'ACCEPTED', topic: 'Career guidance in full-stack development', mentorName: alumni1.name, menteeName: student1.name },
      { mentorId: alumni2.id, menteeId: student2.id, date: new Date('2026-08-12'), timeSlot: '3:00 PM - 3:30 PM', duration: 30, status: 'PENDING', topic: 'Getting started with data science career', mentorName: alumni2.name, menteeName: student2.name },
      { mentorId: alumni3.id, menteeId: student3.id, date: new Date('2026-08-15'), timeSlot: '11:00 AM - 11:30 AM', duration: 30, status: 'ACCEPTED', topic: 'Product management as a career path', mentorName: alumni3.name, menteeName: student3.name },
    ],
  })

  await db.event.createMany({
    data: [
      { title: 'AI & Machine Learning Workshop', description: 'A hands-on workshop covering fundamental AI/ML concepts, practical implementations using Python and TensorFlow, and real-world case studies. Perfect for students looking to break into AI careers.', date: new Date('2026-08-20'), time: '10:00 AM - 4:00 PM', location: 'IT Seminar Hall, Block A', type: 'WORKSHOP', organizerId: placement.id, maxAttendees: 100, currentAttendees: 67, isFeatured: true },
      { title: 'TCS Campus Recruitment Drive 2026', description: 'Annual campus recruitment drive by TCS for final year students. Multiple positions available across technology domains. Pre-placement talk followed by online assessment and interviews.', date: new Date('2026-09-05'), time: '9:00 AM - 5:00 PM', location: 'Main Auditorium', type: 'CAMPUS_DRIVE', organizerId: placement.id, maxAttendees: 200, currentAttendees: 145, isFeatured: true },
      { title: 'Alumni Connect: Industry Insights Panel', description: 'Join our distinguished alumni panel featuring professionals from TCS, Infosys, and Razorpay as they share career insights, industry trends, and tips for placement preparation.', date: new Date('2026-08-25'), time: '2:00 PM - 4:00 PM', location: 'Virtual (Zoom)', type: 'SEMINAR', organizerId: admin.id, maxAttendees: 150, currentAttendees: 89, isFeatured: true },
      { title: 'Resume Building Masterclass', description: 'Learn how to craft an ATS-friendly resume that stands out. Topics include resume formatting, keyword optimization, highlighting achievements, and tailoring for specific roles.', date: new Date('2026-08-18'), time: '11:00 AM - 1:00 PM', location: 'IT Lab, Room 301', type: 'WORKSHOP', organizerId: placement.id, maxAttendees: 50, currentAttendees: 42, isFeatured: false },
      { title: 'Web Development Bootcamp - Week 1', description: 'First week of our intensive 4-week web development bootcamp. Covering HTML, CSS, JavaScript fundamentals and introduction to React.', date: new Date('2026-08-15'), time: '10:00 AM - 1:00 PM', location: 'Computer Lab 2', type: 'WORKSHOP', organizerId: admin.id, maxAttendees: 40, currentAttendees: 38, isFeatured: false },
    ],
  })

  await db.notification.createMany({
    data: [
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
    ],
  })

  console.log('Seeded: users=' + await db.user.count() + ' jobs=' + await db.job.count() + ' apps=' + await db.application.count() + ' mentorships=' + await db.mentorship.count() + ' events=' + await db.event.count() + ' notifications=' + await db.notification.count())
  await db.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
