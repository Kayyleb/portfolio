type props = {
    href: string;
    label: string;
    className?: string;
  };

  // Outlined button for links that leave the site (GitHub, Steam, live demos)
  export default function ExternalLinkButton({ href, label, className = "" }: props) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-md border border-forest px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-surface ${className}`}
      >
        {label}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </a>
  )
}
