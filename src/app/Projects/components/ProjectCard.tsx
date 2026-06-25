type props = {
    name: string;
    description: string;
    skills: string[];
    link: string;
    image: string;
  };

  export default function ProjectCard({ 
    name, 
    description, 
    skills, 
    link, 
    image }: props) {
    return (
        <a href={link}
            target="_blank"
            rel="noopener noreferrer"
        className="group flex h-full flex-col rounded-xl border border-border bg-surface p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
        
        <img
            src={image}
            alt={name}
            className="h-50 w-full rounded-lg border border-border object-cover"
        />

        <h2 className="text-xl font-bold text-center text-forest mt-4">
            {name}
        </h2>

        <p className="mt-2 flex-1 leading-relaxed text-muted whitespace-pre-line">
            {description}
        </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span key={skill} className="whitespace-nowrap rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-forest">
            {skill}
          </span>
        ))}
      </div>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                View project
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
        </a>
  )
}
