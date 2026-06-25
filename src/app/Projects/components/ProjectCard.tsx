type props = {
    name: string;
    description: string;
    skills: string[];
    link: string;
  };

  export default function ProjectCard({ 
    name, 
    description, 
    skills, 
    link }: props) {
          return (
    <div className="border rounded p-4">
      <h2>{name}</h2>

      <p>{description}</p>

      <div>
        {skills.map((skill) => (
          <span key={skill}>
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}
