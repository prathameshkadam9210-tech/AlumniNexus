import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, data } = body

    switch (action) {
      case 'career-chat': {
        const { message } = data
        const response = generateCareerResponse(message)
        return NextResponse.json({ response })
      }

      case 'resume-review': {
        const { skills, experience, education, projects, targetRole, certifications, achievements } = data
        const review = generateResumeReview(skills, experience, education, targetRole, projects, certifications, achievements)
        return NextResponse.json({ review })
      }

      case 'skill-gap': {
        const { userSkills, targetRole } = data
        const analysis = generateSkillGapAnalysis(userSkills, targetRole)
        return NextResponse.json({ analysis })
      }

      case 'career-roadmap': {
        const { currentRole, targetRole, skills } = data
        const roadmap = generateCareerRoadmap(currentRole, targetRole, skills)
        return NextResponse.json({ roadmap })
      }

      case 'interview-questions': {
        const { role, type } = data
        const questions = generateInterviewQuestions(role, type)
        return NextResponse.json({ questions })
      }

      case 'company-suggestions': {
        const { skills, interests, location } = data
        const suggestions = generateCompanySuggestions(skills, interests, location)
        return NextResponse.json({ suggestions })
      }

      default:
        return NextResponse.json({ error: 'Invalid AI action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateCareerResponse(message: string): string {
  const lower = message.toLowerCase()

  if ((lower.includes('job') || lower.includes('role') || lower.includes('career')) && (lower.includes('resume') || lower.includes('cv') || lower.includes('interview'))) {
    return `For this target job, combine your ATS resume and interview preparation:

1. Extract repeated keywords from the job description and use them naturally in your summary, skills, projects, and experience.
2. Put the most relevant technologies and measurable outcomes near the top of the resume.
3. Prepare STAR stories for each major requirement and rehearse a concise introduction.
4. Use plain headings, standard fonts, one-column layout, and no tables or graphics for ATS compatibility.
5. Build one project that demonstrates the role's most important missing skill.

Share the exact job description for a tailored keyword checklist and role-specific interview questions.`
  }

  if (lower.includes('resume') || lower.includes('cv')) {
    return `Great question about resumes! Here are key tips for a standout resume:\n\n1. **Tailor your resume** to each job description - use keywords from the posting\n2. **Quantify achievements** - "Increased sales by 25%" is stronger than "Improved sales"\n3. **Use ATS-friendly formatting** - avoid tables, graphics, and complex layouts\n4. **Lead with a strong summary** - 2-3 lines highlighting your value proposition\n5. **Include relevant skills** - match the job requirements exactly\n6. **Keep it concise** - 1 page for freshers, 2 pages for experienced professionals\n\nWould you like me to analyze your specific resume?`
  }

  if (lower.includes('interview')) {
    return `Interview preparation is crucial! Here's a structured approach:\n\n**Before the Interview:**\n- Research the company thoroughly (mission, products, culture)\n- Practice STAR method for behavioral questions\n- Prepare 3-5 questions to ask the interviewer\n- Review the job description and match your experience\n\n**During the Interview:**\n- Start with a strong 2-minute self-introduction\n- Use STAR (Situation, Task, Action, Result) for behavioral Qs\n- Show enthusiasm and ask clarifying questions\n- Be honest about what you don't know\n\n**Common Questions to Prepare:**\n- "Tell me about yourself"\n- "Why do you want this role?"\n- "Where do you see yourself in 5 years?"\n\nWant role-specific interview questions?`
  }

  if (lower.includes('job') || lower.includes('role') || lower.includes('career')) {
    return `For a job-focused plan, start with the target job description and extract its repeated keywords. Then:

1. Match your resume headline and summary to the target role.
2. Put the most relevant technical skills first.
3. Rewrite project bullets with action, technology, and measurable result.
4. Prepare three STAR stories that prove the job's core requirements.
5. Build one small project that closes your biggest skill gap.

Share the job title or description and I can suggest ATS keywords, resume changes, and interview questions for that exact role.`
  }

  if (lower.includes('skill') || lower.includes('learn')) {
    return `Building the right skills is essential for career growth! Here's my guidance:\n\n**In-Demand Tech Skills (2026):**\n- AI/ML & Prompt Engineering\n- Cloud Computing (AWS, Azure, GCP)\n- Full-Stack Development (React, Node.js, Python)\n- Data Science & Analytics\n- Cybersecurity\n- DevOps & CI/CD\n\n**How to Build Skills Effectively:**\n1. Start with fundamentals - strong basics prevent knowledge gaps\n2. Build projects - theory without practice is incomplete\n3. Contribute to open source - real-world collaboration experience\n4. Get certified - validates your knowledge for recruiters\n5. Network and learn from peers\n\nTell me your current skills and target role, and I'll create a personalized learning path!`
  }

  return `I'm your AI Career Assistant! I can help you with:\n\n🎯 **Career Guidance** - Choose the right path based on your interests and skills\n📝 **Resume Building** - ATS-friendly resumes that get noticed\n🔍 **Skill Gap Analysis** - Find what you need to learn for your dream role\n🗺️ **Career Roadmap** - Step-by-step plan to reach your goals\n🎤 **Interview Prep** - Role-specific questions and strategies\n🏢 **Company Matching** - Find companies that fit your profile\n\nWhat would you like help with today? Just describe your question or situation!`
}

function generateResumeReview(skills: string[], experience: string, education: string, targetRole: string, projects: unknown[] = [], certifications = '', achievements = '') {
  const keywordCoverage = targetRole ? Math.min(100, 45 + skills.length * 7 + (projects.length > 0 ? 12 : 0) + (certifications ? 10 : 0)) : 50
  return {
    score: Math.round((keywordCoverage + (achievements ? 8 : 0)) / 2),
    sections: [
      { name: 'Contact Information', score: 100, feedback: 'Complete and professional' },
      { name: 'Summary/Objective', score: 65, feedback: 'Could be more targeted towards ' + targetRole + '. Include key achievements and value proposition.' },
      { name: 'Skills Section', score: 70, feedback: `${skills.length} skills listed. Consider adding more ${targetRole}-specific skills and certifications.` },
      { name: 'Experience', score: 75, feedback: 'Good experience description. Add more quantifiable achievements and metrics.' },
      { name: 'Education', score: 80, feedback: `${education} is relevant. Consider adding relevant coursework or projects.` },
      { name: 'Projects', score: projects.length > 0 ? 82 : 60, feedback: projects.length > 0 ? 'Projects are present. Align each project bullet with the target role keywords.' : 'Add 2-3 impactful projects with descriptions of your role and technologies used.' },
      { name: 'Certifications and Achievements', score: certifications || achievements ? 85 : 45, feedback: certifications || achievements ? 'Good evidence of credibility. Keep only role-relevant items.' : 'Add role-relevant certifications, awards, leadership, or measurable achievements.' },
    ],
    suggestions: [
      `Add a professional summary tailored for ${targetRole} roles`,
      'Include metrics and quantifiable achievements in experience descriptions',
      'Add relevant certifications (AWS, Azure, Google Cloud, etc.)',
      'Include a projects section showcasing practical applications',
      `Optimize for ATS by matching keywords from ${targetRole} job descriptions`,
    ],
    atsCompatibility: 78,
  }
}

function generateSkillGapAnalysis(userSkills: string[], targetRole: string) {
  const roleSkillMap: Record<string, string[]> = {
    'frontend': ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Testing', 'Web Performance'],
    'backend': ['Node.js', 'Python', 'Database Design', 'API Design', 'Cloud Services', 'Security'],
    'fullstack': ['React', 'Node.js', 'Database', 'APIs', 'Cloud Deployment', 'DevOps'],
    'data': ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Data Visualization', 'Big Data'],
    'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Cloud (AWS/GCP)', 'Monitoring', 'IaC (Terraform)'],
  }

  const key = Object.keys(roleSkillMap).find(k => targetRole.toLowerCase().includes(k))
  const requiredSkills = key ? roleSkillMap[key] : roleSkillMap['fullstack']

  const matched = requiredSkills.filter(s => userSkills.some(us => us.toLowerCase().includes(s.toLowerCase())))
  const missing = requiredSkills.filter(s => !userSkills.some(us => us.toLowerCase().includes(s.toLowerCase())))

  return {
    targetRole,
    matchedSkills: matched,
    missingSkills: missing.map(s => ({
      skill: s,
      priority: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      estimatedTime: `${Math.floor(Math.random() * 8) + 2} weeks`,
      resources: [
        `Online course on ${s}`,
        `Hands-on project building ${s} applications`,
        `${s} certification path`,
      ],
    })),
    overallMatch: Math.round((matched.length / requiredSkills.length) * 100),
  }
}

function generateCareerRoadmap(currentRole: string, targetRole: string, skills: string[]) {
  return {
    currentRole,
    targetRole,
    timeline: '6 months',
    phases: [
      {
        phase: 'Foundation (Weeks 1-4)',
        tasks: [
          `Strengthen core ${targetRole} fundamentals`,
          'Complete 2 foundational courses',
          'Build one small project to apply concepts',
        ],
      },
      {
        phase: 'Skill Building (Weeks 5-10)',
        tasks: [
          `Learn advanced ${skills.slice(0, 2).join(' and ')} concepts`,
          'Contribute to open-source projects',
          'Build a portfolio project',
          'Start networking in the field',
        ],
      },
      {
        phase: 'Specialization (Weeks 11-16)',
        tasks: [
          `Master ${targetRole}-specific tools and frameworks`,
          'Work on 2-3 complex projects',
          'Get relevant certifications',
          'Start applying for positions',
        ],
      },
      {
        phase: 'Launch (Weeks 17-24)',
        tasks: [
          'Polish portfolio and resume',
          'Practice interviews with mock sessions',
          'Apply to target companies',
          'Leverage alumni network for referrals',
        ],
      },
    ],
    milestones: [
      { week: 4, goal: 'Complete foundational learning' },
      { week: 10, goal: 'Build 3 portfolio projects' },
      { week: 16, goal: 'Get certified' },
      { week: 24, goal: 'Land target role' },
    ],
  }
}

function generateInterviewQuestions(role: string, type: string) {
  return [
    { question: `Tell me about yourself and why you're interested in ${role}?`, type: 'behavioral', difficulty: 'Easy', sampleAnswer: 'Focus on your relevant experience, passion for the field, and how your skills align with the role.' },
    { question: `What's the most challenging ${role === 'Software Engineer' ? 'technical problem' : 'project'} you've solved?`, type: 'behavioral', difficulty: 'Medium', sampleAnswer: 'Use STAR method - describe the Situation, Task, Action, and Result with measurable outcomes.' },
    { question: 'How do you stay updated with the latest trends in your field?', type: 'behavioral', difficulty: 'Easy', sampleAnswer: 'Mention blogs, conferences, online courses, and communities you follow.' },
    { question: `Describe a time you worked under pressure to meet a tight deadline.`, type: 'behavioral', difficulty: 'Medium', sampleAnswer: 'Show prioritization, time management, and quality maintenance under pressure.' },
    { question: 'Where do you see yourself in 3-5 years?', type: 'behavioral', difficulty: 'Easy', sampleAnswer: 'Align your growth path with the company and role trajectory.' },
    { question: `What is your approach to debugging complex issues?`, type: 'technical', difficulty: 'Medium', sampleAnswer: 'Describe systematic approach: reproduce → isolate → hypothesize → test → verify.' },
    { question: 'How would you handle disagreements with team members?', type: 'situational', difficulty: 'Medium', sampleAnswer: 'Emphasize communication, data-driven decisions, and finding common ground.' },
    { question: `What questions do you have for us?`, type: 'conversational', difficulty: 'Easy', sampleAnswer: 'Ask about team culture, growth opportunities, and current challenges.' },
  ]
}

function generateCompanySuggestions(skills: string[], interests: string, location: string) {
  const companies = [
    { name: 'TCS', type: 'IT Services', match: 85, culture: 'Professional growth oriented', roles: ['Software Developer', 'System Engineer'] },
    { name: 'Infosys', type: 'IT Consulting', match: 82, culture: 'Learning-focused with global exposure', roles: ['Technology Analyst', 'Developer'] },
    { name: 'Wipro', type: 'IT Services', match: 78, culture: 'Innovation-driven workplace', roles: ['Project Engineer', 'Developer'] },
    { name: 'Persistent Systems', type: 'Product Development', match: 80, culture: 'Product innovation focused', roles: ['Software Engineer', 'Full Stack Developer'] },
    { name: 'Zoho', type: 'SaaS Products', match: 88, culture: 'Bootstrapped, product-centric', roles: ['Developer', 'Product Engineer'] },
    { name: 'Freshworks', type: 'SaaS/CRM', match: 75, culture: 'Fast-paced startup culture', roles: ['Software Engineer', 'Full Stack Developer'] },
    { name: 'Razorpay', type: 'Fintech', match: 90, culture: 'Modern tech stack, engineering-driven', roles: ['Backend Engineer', 'Frontend Engineer'] },
    { name: 'CRED', type: 'Fintech', match: 82, culture: 'Premium product experience', roles: ['Software Developer', 'UI Engineer'] },
  ]

  return companies.map(c => ({
    ...c,
    whyMatch: `Your skills in ${skills.slice(0, 3).join(', ')} align well with their tech stack and requirements.`,
  }))
}
