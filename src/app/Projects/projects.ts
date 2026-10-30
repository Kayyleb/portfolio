export type Project = {
    slug: string; // used in the URL: /Projects/<slug>
    name: string;
    tagline: string;
    label?: string; // small badge, e.g. "Senior Project"
    description: string;
    skills: string[];
    link?: string; // leave out if there's nothing to link to yet
    linkLabel?: string;
    images: string[]; // all show in the gallery; the first is the cover unless `cover` is set
    cover?: string; // card image that isn't part of the gallery, e.g. a logo
    featured: boolean;
  };

  export const projects: Project[] = [
    {
      slug: "sprout",
      name: "Sprout",
      tagline: "Mobile Finance Tracker",
      label: "Senior Project · In Progress",
      description: "Sprout is a personal finance and money managing app dedicated to helping the user track finances, manage their budget, and understand their financial standing.",
      skills: ["React Native", "Python", "SQLite", "Plaid API"],
      link: "https://github.com/kayyleb/Sprout",
      linkLabel: "View code",
      images: ["/sprout.jpg"],
      featured: true,
    },
    {
      slug: "depths",
      name: "Depths",
      tagline: "3D Multiplayer Game",
      label: "Junior Project",
      description: "Depths is a cooperative multiplayer game where you and up to three friends delve into procedurally generated caves, collecting items, going deeper, making sure to meet quota every dive. Avoid the monsters that dwell in these caverns if you and your friends hope to make it out alive.",
      skills: ["Unity", "C#", "JSON", "Blender"],
      link: "https://store.steampowered.com/app/4808100/Depths/",
      linkLabel: "View on Steam",
      images: [
        "/depths-shop.jpg",
        "/depths-goblin.jpg",
        "/depths-mushroom-cave.jpg",
        "/depths-lava.jpg",
        "/depths-soccer.jpg",
        "/depths-lantern-cave.jpg",
      ],
      cover: "/depths.jpg",
      featured: true,
    },
    {
      slug: "basin-time-tracker",
      name: "Punch",
      tagline: "Employee Time Clock for Basin Family Janitorial",
      label: "Freelance · Used Daily",
      description: "Punch is a time tracking web app I designed, built, and deployed for Basin Family Janitorial, now used daily by their full 12 person team. It replaced manual hour tracking and text message pay period submissions. Employees clock in and out from their phones, and managers get a dashboard to review hours, fix punches, and export them directly to Gusto for payroll.",
      skills: ["Next.js", "TypeScript", "Supabase", "Vercel"],
      images: ["/basin-signin.png", "/basin-employee.png", "/basin-manager.png", "/basin-people.png"],
      cover: "/basin-cover.png",
      featured: true,
    },
    {
      slug: "ashtray",
      name: "Ashtray",
      tagline: "Log, Rate & Collect Mobile App",
      label: "In Progress",
      description: "Ashtray is a mobile app for rating, reviewing and collecting cigarettes, modeled on Letterboxd and Discogs. Users log what they tried with a star rating, taste and moment tags, and a short review, building a Letterboxd-style diary. Collectors can catalog the packs they own by version and condition, browse each brand's history, and keep a wantlist. It records what a person tried and what they thought, not how much they smoke, so there are no daily counts, streaks or consumption badges. The current build is an interactive prototype, with the full app in development for deployment.",
      skills: ["JavaScript", "HTML", "CSS"],
      images: ["/ashtray-home.png", "/ashtray-entry.png", "/ashtray-log.png", "/ashtray-search.png", "/ashtray-shelf.png"],
      cover: "/ashtray-cover.png",
      featured: false,
    },
    {
      slug: "zenith",
      name: "Zenith",
      tagline: "Personalized Workout Application",
      description: "Zenith is a personalized workout application that allows the user to create and set routines for themselves while tracking their fitness progress.",
      skills: ["React", "JavaScript", "Firebase"],
      link: "https://workouttracker-b5aab.web.app/",
      linkLabel: "Live site",
      images: [],
      cover: "/zenith-cover.png",
      featured: false,
    },
    {
      slug: "portfolio",
      name: "Portfolio Website",
      tagline: "This site",
      description: "This portfolio website was created to showcase my projects and skills as a software engineer. Check out the source code on GitHub to see how it was built.",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
      link: "https://github.com/kayyleb/portfolio",
      linkLabel: "View code",
      images: ["/portfolio.jpg"],
      featured: false,
    },
    {
      slug: "used-car-price-predictor",
      name: "Used Car Price Predictor",
      tagline: "Machine Learning Models",
      description: "Two machine learning models that predict the price of used cars based on various features such as make, model, year, mileage, and condition, using Linear Regression and K-Nearest Neighbors algorithms.",
      skills: ["Python", "Scikit-learn", "Pandas", "Matplotlib"],
      link: "https://github.com/kayyleb/Used_Car_Price_Predictor",
      linkLabel: "View code",
      images: [
        "/predictor-price-factors.png",
        "/predictor-make-avg-price.png",
        "/predictor-price-distribution.png",
        "/predictor-actual-vs-predicted.png",
        "/predictor-knn-results.png",
      ],
      cover: "/predictor.jpg",
      featured: false,
    }
  ];
