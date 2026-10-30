import ProjectCard from "./components/ProjectCard";
import { projects } from "./projects";

export default function Projects() {
  return (
    <div className="mx-auto mt-20 max-w-6xl">

        <p className="text-2xl font-semibold tracking-tight text-forest text-center sm:text-3xl">
            PROJECTS
        </p>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted">
            Things I&apos;ve built, from school projects to apps people use. Click a project for details and photos.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} />
            ))}
        </div>
    </div>
  )
}
