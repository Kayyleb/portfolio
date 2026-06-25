export type Project = {
    name: string;
    description: string;
    skills: string[];
    link: string;
    image: string;
  };

  export const projects: Project[] = [
    {
      name: "Sprout - Mobile Finance Tracker",
      description: "Currently creating for my Senior project: \n Sprout is a personal finance and money managing app that is dedicated to help the user track finances, manage their budget, and understand their financial standing.",
      skills: ["React Native", "Python", "SQLite", "Plaid API"],
      link: "https://github.com/kayyleb/Sprout",
      image: "/sprout.jpg",
    },
    {
      name: "Depths - 3D Multiplayer Game",
      description: "Created for my Junior project: \n Depths is a cooperative multiplayer game where you and up to three friends delve into procedurally generated caves, collecting items, going deeper, making sure to meet quota every dive. Avoid the monsters that dwell in these caverns if you and your friends hope to make it out alive.",
      skills: ["Unity", "C#", "JSON", "Blender"],
      link: "https://store.steampowered.com/app/4808100/Depths/",
      image: "/depths.jpg",
    },
    {
      name: "Zenith - Personalized Workout Application",
      description: "Zenith is a personalized workout application to allow the user to create and set routines for themselves while tracking their fitness progress.",
      skills: ["React", "JavaScript", "Firebase"],
      link: "https://workouttracker-b5aab.web.app/",
      image: "/zenith.jpg",
    },
    {
      name: "Portfolio Website",
      description: "This portfolio website was created to showcase my projects and skills as a software engineer. Check out the source code on GitHub to see how it was built.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      link: "https://github.com/kayyleb/portfolio",
      image: "/portfolio.jpg",
    },
    {
      name: "Used Car Price Predictor",
      description: "Two machine learning models that predict the price of used cars based on various features such as make, model, year, mileage, and condition. Using Linear Regression and K-Nearest Neighbors algorithms.",
      skills: ["Python", "Scikit-learn", "Pandas", "Matplotlib"],
      link: "https://github.com/kayyleb/Used_Car_Price_Predictor",
      image: "/predictor.jpg",
    }
  ];