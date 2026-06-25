import ProjectCard from "./Projects/components/ProjectCard";
import { projects } from "./Projects/projects";

export default function Home() {
  const featuredProjects = projects.filter((project) => project.featured);

  return (
    <main className="min-h-screen bg-bg px-6 py-20 text-ink sm:px-12 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-8">
          <img
            src="/profile2.jpg"
            alt="Kayleb Cook"
            className="h-24 w-24 rounded-full border border-border object-cover sm:h-60 sm:w-60"
          />

          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Kayleb Cook
            </h1>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-forest">
              Software Engineering Student
            </p>

            <div className="mt-4 flex items-center gap-5">
              <a
                href="mailto:KaylebJulianCook@gmail.com"
                aria-label="Email Kayleb Cook"
                className="text-accent hover:text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </a>

              <a
                href="https://www.linkedin.com/in/kaylebcook/"
                aria-label="Kayleb Cook on LinkedIn"
                className="text-accent hover:text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.39-1.56 2.86-1.56 3.06 0 3.63 2.02 3.63 4.64v6.42z" />
                </svg>
              </a>

              <a
                href="https://github.com/kayyleb"
                aria-label="Kayleb Cook on GitHub"
                className="text-accent hover:text-ink"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.089-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.225.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-forest">
            Skills:
          </h2>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {["Python", "C#", "C++", "JavaScript", "TypeScript", "SQL", "React", "React Native", "Firebase", "SQLite", "MSSQL", "BigQuery", "Git", "Unity"].map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-forest"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <p className="text-2xl font-semibold tracking-tight text-forest">
            Featured Projects
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard
                key={project.name}
                name={project.name}
                description={project.description}
                skills={project.skills}
                link={project.link}
                image={project.image}
              />
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight text-forest">
            About Me:
          </h2>

          <p className="mt-3 leading-relaxed text-muted">
            I am a software engineering student at Oregon Tech with a passion for learning and creating impactful projects. I have experience in various
            programming languages and frameworks, and I am always open minded to exploring more technologies. I enjoy focusing on backend work, such as 
            database management, API development, and functional programming, but I also have experience in frontend and game development, 
            and I want to continue to expand my knowledge in those areas, as well as any other areas I could grow in. I am a team player and enjoy working and
            collaborating with others to create unique and innovative software.
            
          </p>
        </div>
      </div>
    </main>
  );
}