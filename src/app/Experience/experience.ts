// Technical jobs list languages, non-technical jobs list skills
  export type Experience = {
    company: string;
    role: string;
    logo: string;
    startDate: string;
    endDate?: string; // leave out for a job you still have
    bullets: string[];
    current?: boolean;
    projectLink?: string;
  } & (
    | { technical: true; languages: string[] }
    | { technical: false; skills: string[] }
  );

  export const experiences: Experience[] = [
    {
      company: "Harmonee AI",
      role: "Software Engineer",
      logo: "/harmonee.png",
      startDate: "Oct 2026",
      bullets: [
        "Built a centralized communication dashboard with Python, Flask, and SQLAlchemy that unifies the county's phone and email agents into one interface, cutting out constant switching between tools.",
        "Develop internal tooling and AI systems at Harmonee using Python, Rust, and Claude plugins, focused on automating workflows and boosting team productivity.",
      ],
      languages: ["Rust", "Python", "TypeScript", "Next.js", "Flask", "SQL"],
      technical: true,
      current: true,
    },
    {
      company: "Harmonee AI",
      role: "Software Engineer Intern",
      logo: "/harmonee.png",
      startDate: "Aug 2026",
      endDate: "Oct 2026",
      bullets: [
        "Built a centralized communication dashboard with Python, Flask, and SQLAlchemy that unifies the county's phone and email agents into one interface, cutting out constant switching between tools.",
        "Develop internal tooling and AI systems at Harmonee using Python, Rust, and Claude plugins, focused on automating workflows and boosting team productivity.",
      ],
      languages: ["Rust", "Python", "TypeScript", "Next.js", "Flask", "SQL"],
      technical: true,
    },
    {
      company: "Basin Family Janitorial",
      role: "Freelance Software Engineer",
      logo: "/basin.png",
      startDate: "Aug 2026",
      bullets: [
        "Designed, built, and deployed a time tracking web app for Basin Family Janitorial, now used daily by the full 12 person team.",
        "Replaced manual hour tracking and text message pay period submissions.",
        "Built an admin dashboard that can export punches directly to Gusto for payroll.",
      ],
      languages: ["Next.js", "TypeScript", "Supabase", "Vercel"],
      technical: true,
      projectLink: "/Projects/basin-time-tracker",
    },
    {
      company: "Basin Family Janitorial",
      role: "After Hours Custodian",
      logo: "/basin.png",
      startDate: "Jul 2026",
      bullets: [
        "Part-time cleaner for local medical businesses across Klamath Falls.",
        "Independently built and maintain the company's time tracking web app.",
      ],
      skills: ["Time Management", "Cleaning"],
      technical: false,
    },
    {
      company: "Starbucks Coffee Company",
      role: "Shift Supervisor",
      logo: "/starbucks.png",
      startDate: "Jul 2022",
      bullets: [
        "Lead the team during shifts, delegating tasks to partners, and making key operational decisions",
        "Handle and par store cash deposits and registers",
        "Maintain a clean, organized cafe environment while ensuring every customer receives an exceptional experience",
        "Train and coach new partners to uphold Starbucks standards and service quality",
        "Resolve customer issues quickly and positively to maintain satisfaction",
      ],
      skills: ["Leadership", "Cash Handling", "Customer Service", "Training", "Problem Solving"],
      technical: false,
    },
  ];
