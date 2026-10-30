import Link from "next/link";
import { Project } from "../projects";
import ExternalLinkButton from "./ExternalLinkButton";

type props = {
    project: Project;
  };

  export default function ProjectCard({ project }: props) {
    const photoCount = project.images.length;

    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-video overflow-hidden border-b border-border bg-white">
            <img
                src={project.cover ?? project.images[0]}
                alt={project.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            {photoCount > 1 && (
                <span className="absolute right-3 bottom-3 rounded-md bg-ink/75 px-2 py-0.5 text-xs font-medium text-white">
                    {photoCount} photos
                </span>
            )}
        </div>

        <div className="flex flex-1 flex-col p-6">
            {project.label && (
                <span className="mb-2 self-start rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                    {project.label}
                </span>
            )}

            <h2 className="text-xl font-bold leading-snug text-forest">
                {/* Covers the whole card, so clicking anywhere opens the project page */}
                <Link href={`/Projects/${project.slug}`} className="after:absolute after:inset-0">
                    {project.name}
                </Link>
            </h2>
            <p className="text-sm font-medium text-muted">
                {project.tagline}
            </p>

            <div className="mt-3 flex-1">
                <p className="line-clamp-3 text-[15px] leading-relaxed text-muted">
                    {project.description}
                </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
                {project.skills.map((skill) => (
                    <span key={skill} className="whitespace-nowrap rounded-md border border-border bg-bg px-2.5 py-1 text-xs font-medium text-forest">
                        {skill}
                    </span>
                ))}
            </div>

            {/* Fixed height so cards line up whether or not they have a See project button */}
            <div className="mt-5 flex h-9 items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-forest">
                    Details
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

                {project.link && (
                    // Sits above the card-wide link so it stays clickable on its own
                    <ExternalLinkButton
                        href={project.link}
                        label="See project"
                        className="relative z-10"
                    />
                )}
            </div>
        </div>
        </div>
  )
}
