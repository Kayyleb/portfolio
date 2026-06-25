export default function Projects() {
  return (
    <main className="min-h-screen bg-bg px-6 py-20 text-ink sm:px-12 sm:py-28">
      <div className="mx-auto max-w-6xl"></div>

        <div className="mt-20">
          <p className="text-2xl font-semibold tracking-tight text-forest">
            Featured Projects
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">

            <a
              href="https://kaylebcook.dev"
              className="group flex h-full flex-col rounded-xl border border-border bg-surface p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <h3 className="text-xl font-bold">
                Sprout - Mobile Finance Tracker
              </h3>

              <p className="mt-2 flex-1 leading-relaxed text-muted">
                Currently creating for my Senior project: <br /> 
                Sprout is a personal finance and money managing app that is dedicated to help the user track finances, manage their budget,
                and understand their financial standing.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["React Native", "Python", "SQLite", "Plaid API"].map((tag) => (
                  <span
                    key={tag}
                    className="whitespace-nowrap rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-forest"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                View project
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
            </a>

            <a
              href="https://store.steampowered.com/app/4808100/Depths/"
              className="group flex h-full flex-col rounded-xl border border-border bg-surface p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <h3 className="text-xl font-bold">
                Depths - 3D Multiplayer Game
              </h3>

              <p className="mt-2 flex-1 leading-relaxed text-muted">
                Created for my Junior project: <br /> 
                Depths is a cooperative multiplayer game where you and up to three friends delve into procedurally generated caves,
                collecting items, going deeper, making sure to meet quota every dive. Avoid the monsters that dwell in these caverns
                if you and your friends hope to make it out alive.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Unity", "C#", "JSON", "Blender"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-forest"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                View project
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
            </a>

            <a
              href="https://workouttracker-b5aab.web.app/"
              className="group flex h-full flex-col rounded-xl border border-border bg-surface p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <h3 className="text-xl font-bold">
                Zenith - Personalized Workout App
              </h3>

              <p className="mt-2 flex-1 leading-relaxed text-muted">
                Zenith is a personalized workout application to allow the user to create and set routines for themselves while tracking their fitness progress.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {["React", "JavaScript", "Firebase"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm font-medium text-forest"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                View project
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
            </a>

          </div>
        </div>
      </main>
  );
}