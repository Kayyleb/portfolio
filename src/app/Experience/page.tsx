"use client";

import { useState } from "react";
import ExperienceTimeline from "./components/ExperienceTimeline";
import { experiences } from "./experience";

const tabs = [
  { label: "Technical", technical: true },
  { label: "Non-Technical", technical: false },
];

export default function ExperiencePage() {
  const [showTechnical, setShowTechnical] = useState(true);
  const shownExperiences = experiences.filter(
    (experience) => experience.technical === showTechnical
  );

  return (
    <div className="mt-20">

        <p className="text-2xl font-semibold tracking-tight text-forest text-center sm:text-3xl">
            EXPERIENCE
        </p>

        <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-xl border border-border bg-surface p-1">
                {tabs.map((tab) => (
                    <button
                    key={tab.label}
                    onClick={() => setShowTechnical(tab.technical)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        showTechnical === tab.technical
                        ? "bg-forest text-surface shadow-sm"
                        : "text-muted hover:text-forest"
                    }`}
                    >
                    {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
            {shownExperiences.length > 0 ? (
                <ExperienceTimeline experiences={shownExperiences} />
            ) : (
                <p className="text-center text-muted">Nothing here yet.</p>
            )}
        </div>
    </div>
  )
}
