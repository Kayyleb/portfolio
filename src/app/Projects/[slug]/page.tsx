import Link from "next/link";
import { notFound } from "next/navigation";
import ExternalLinkButton from "../components/ExternalLinkButton";
import ProjectGallery from "../components/ProjectGallery";
import BilliardsGame from "../components/BilliardsGame";
import { projects } from "../projects";

// Builds one page per project ahead of time
export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((project) => project.slug === slug);
  return { title: project ? `${project.name} | Kayleb Cook` : "Project not found" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((project) => project.slug === slug);
  if (!project) notFound();

  return (
    <div className="mx-auto mt-12 max-w-4xl">
        <Link href="/Projects" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-forest">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            All projects
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                {project.label && (
                    <span className="mb-2 inline-block rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest">
                        {project.label}
                    </span>
                )}
                <h1 className="text-4xl font-bold tracking-tight text-forest">
                    {project.name}
                </h1>
                <p className="mt-1 text-lg font-medium text-muted">
                    {project.tagline}
                </p>
            </div>

            {project.link && (
                <ExternalLinkButton href={project.link} label={project.linkLabel ?? "See project"} />
            )}
        </div>

        <p className="mt-6 max-w-3xl leading-relaxed text-muted">
            {project.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
            {project.skills.map((skill) => (
                <span key={skill} className="whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-forest">
                    {skill}
                </span>
            ))}
        </div>

        {project.playable === "billiards" && (
            <>
                <h2 className="mt-12 text-xl font-semibold tracking-tight text-forest">
                    Play it
                </h2>
                <div className="mt-4">
                    <BilliardsGame />
                </div>
            </>
        )}

        {project.images.length > 0 && (
            <>
                <h2 className="mt-12 text-xl font-semibold tracking-tight text-forest">
                    Photos
                </h2>
                <div className="mt-4">
                    <ProjectGallery name={project.name} images={project.images} />
                </div>
            </>
        )}
    </div>
  )
}
