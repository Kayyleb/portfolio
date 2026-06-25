import ProjectCard from "./components/ProjectCard";
import { projects } from "./projects";

export default function Projects() {
  return (
    <div className="grid gap-6">

      {projects.map((project) => (
        <ProjectCard
          key={project.name}
          name={project.name}
          description={project.description}
          skills={project.skills}
          link={project.link}
        />
      ))}

    </div>
  )
}