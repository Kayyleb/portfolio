import ProjectCard from "./components/ProjectCard";
import { projects } from "./projects";

export default function Projects() {
  return (
    <div className="mt-20">

        <p className="text-2xl font-semibold tracking-tight text-forest text-center sm:text-3xl">
            ALL PROJECTS
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {projects.map((project) => (
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
  )
}