export default function Home() {
  return (
    <main className="min-h-screen px-6 py-16 sm:px-10 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl font-bold tracking-tight">
          Kayleb Cook
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-neutral-600 light:text-neutral-300">
          Software Engineer --
          Backend · Full Stack · Machine Learning · Mobile Development · Game Development
        </p>

        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight">
              About Me: 
          </h1>

          <p className="mt-3 leading-relaxed text-neutral-700 light:text-neutral-300">
              I am a software engineering student at Oregon Tech with a passion for learning and creating impactful projects.
              With my experience from coursework and personal projects, I have developed a strong foundaton in software development, 
              and I am eager to apply my skills to real world scenarios.
          </p>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            Featured Projects
          </h2>

          {/* Project blocks: */}
          <div className="mt-5 rounded-xl border border-neutral-200 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800">
            <h3 className="text-xl font-bold">
              Sprout - Mobile Finance Tracker
            </h3>

            <p className="mt-2 leading-relaxed text-neutral-700 light:text-neutral-300">
              Sprout is a personal finance and money managing app that is dedicated to help the user track finances, manage their budget, 
              and understand their financial standing. Sprout will be able to connect directly to the user's financial accounts and give 
              them various summaries of where their finances stand whether it be retirement account, savings, checking, investments, or debt. 
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-neutral-200 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800">
            <h3 className="text-xl font-bold">
              Depths - 3D Multiplayer Game
            </h3>

            <p className="mt-2 leading-relaxed text-neutral-700 light:text-neutral-300">
             Depths is a cooperative multiplayer game where you and up to three friends​ delve into procedurally generated caves, 
             collecting items,​ going deeper, making sure to meet quota every dive. Avoid the monsters that dwell in these caverns​ 
             if you and your friends hope to make it out alive.​
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-neutral-200 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-neutral-800">
            <h3 className="text-xl font-bold">
              Zenith - Personalized Workout App
            </h3>

            <p className="mt-2 leading-relaxed text-neutral-700 light:text-neutral-300">
              The user will be allowed to create and edit a workout template for themselves when creating an account; then the 
              application will help monitor and track sets, reps, personal records, day streaks, and rest days by storing the 
              user's workout information into a database where their information will be kept secure, and able to be tracked within the app.
            </p>
          </div>
        </div>

        <div className="mt-14 mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Contact Me: 
          </h2>
          <p className="mt-3 leading-relaxed text-neutral-700 light:text-neutral-300">
            {" "}
            <a
              href="mailto: KaylebJulianCook@gmail.com"
              className="inline-flex items-center gap-1.5 text-blue-500 underline underline-offset-2 hover:text-blue-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 6-10 7L2 6" />
              </svg>
              KaylebJulianCook@gmail.com
            </a>
              <br />
            {" "}
            <a
              href="https://www.linkedin.com/in/kaylebcook/"
              className="inline-flex items-center gap-1.5 text-blue-500 underline underline-offset-2 hover:text-blue-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 shrink-0"
              >
                <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76 1.75.79 1.75 1.76-.78 1.76-1.75 1.76zm13.5 12.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-11h2.88v1.5h.04c.4-.76 1.39-1.56 2.86-1.56 3.06 0 3.63 2.02 3.63 4.64v6.42z" />
              </svg>
              https://www.linkedin.com/in/kaylebcook/
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}