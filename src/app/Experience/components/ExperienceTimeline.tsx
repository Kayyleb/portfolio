import Link from "next/link";
import { Experience } from "../experience";

type props = {
    experiences: Experience[];
  };

  export default function ExperienceTimeline({ experiences }: props) {
    return (
      <ol>
        {experiences.map((experience, index) => {
          const isLast = index === experiences.length - 1;
          // Back-to-back roles at the same company share one logo and name
          const sameCompanyAsPrevious =
            index > 0 && experiences[index - 1].company === experience.company;
          const tags = experience.technical ? experience.languages : experience.skills;

          return (
            <li key={`${experience.company}-${experience.role}`} className="flex gap-4 sm:gap-6">
              <div className="flex w-12 shrink-0 justify-center sm:w-16">
                {!sameCompanyAsPrevious && (
                  <img
                    src={experience.logo}
                    alt={`${experience.company} logo`}
                    className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                  />
                )}
              </div>

              {/* Timeline node, with a line down to the next node */}
              <div className="relative flex w-3 shrink-0 justify-center">
                {!isLast && (
                  <span className="absolute top-3 bottom-0 w-px bg-border" />
                )}
                {index > 0 && (
                  <span className="absolute top-0 h-3 w-px bg-border" />
                )}

                <span className="relative mt-2.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400 ring-4 ring-bg" />
                </span>
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-12"}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <div>
                    {sameCompanyAsPrevious ? (
                      <h3 className="text-lg font-semibold leading-7 text-forest">
                        {experience.role}
                      </h3>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold leading-7 text-forest">
                          {experience.company}
                        </h3>
                        <p className="font-medium text-muted">
                          {experience.role}
                        </p>
                      </>
                    )}
                    <p className="mt-0.5 text-sm text-muted">
                      {experience.startDate} – {experience.endDate ?? "Present"}
                    </p>
                  </div>

                  {experience.projectLink && (
                    <Link
                      href={experience.projectLink}
                      className="group inline-flex items-center gap-1 rounded-md border border-forest px-3 py-1 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-surface"
                    >
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
                    </Link>
                  )}
                </div>

                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-muted marker:text-border">
                  {experience.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-forest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
  )
}
