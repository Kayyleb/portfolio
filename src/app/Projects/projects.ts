export type Project = {
    name: string;
    description: string;
    skills: string[];
    link: string;
  };

  export const projects: Project[] = [
    {
      name: "Sprout - Mobile Finance Tracker",
      description: "Currently creating for my Senior project: Sprout is a personal finance and money managing app that is dedicated to help the user track finances, manage their budget, and understand their financial standing.",
      skills: ["React Native", "Python", "SQLite", "Plaid API"],
      link: "https://kaylebcook.dev",
    },
    {
      name: "Depths - 3D Multiplayer Game",
      description: "Created for my Junior project: Depths is a cooperative multiplayer game where you and up to three friends delve into procedurally generated caves, collecting items, going deeper, making sure to meet quota every dive. Avoid the monsters that dwell in these caverns if you and your friends hope to make it out alive.",
      skills: ["Unity", "C#", "JSON", "Blender"],
      link: "https://store.steampowered.com/app/4808100/Depths/",
    },
    {
      name: "Zenith - Personalized Workout Application",
      description: "Zenith is a personalized workout application to allow the user to create and set routines for themselves while tracking their fitness progress.",
      skills: ["React", "Node.js", "Express", "MongoDB"],
      link: "https://workouttracker-b5aab.web.app/",
    },
    {
      name: "Portfolio Website",
      description: "This portfolio website was created to showcase my projects and skills as a software engineer. It is built using Next.js, TypeScript, and Tailwind CSS.",
      skills: ["Next.js", "TypeScript", "Tailwind CSS"],
      link: "https://kaylebcook.dev",
    },
    {
      name: "Used Car Price Predictor",
      description: "A machine learning model that predicts the price of used cars based on various features such as make, model, year, mileage, and condition.",
      skills: ["Python", "Scikit-learn", "Pandas", "BigQuery"],
      link: "github.com/kayyleb/Used_Car_Price_Predictor",
    }
  ];