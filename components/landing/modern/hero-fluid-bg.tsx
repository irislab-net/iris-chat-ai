/** Organic silk-wave background for the hero card (SphereAI-style). */
export function HeroFluidBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hero-wave-a" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="45%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="hero-wave-b" x1="100%" y1="100%" x2="0%" y2="20%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="hero-wave-c" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <radialGradient id="hero-glow-center" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.22" />
            <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.15" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="hero-wave-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="hero-wave-blur-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="32" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="url(#hero-glow-center)" className="hero-fluid-glow" />

        <g className="hero-fluid-wave hero-fluid-wave-a" filter="url(#hero-wave-blur-soft)" opacity="0.92">
          <path
            d="M-120 920 C 180 520, 420 380, 720 320 C 980 270, 1180 180, 1560 80 L 1560 920 Z"
            fill="url(#hero-wave-a)"
          />
        </g>

        <g className="hero-fluid-wave hero-fluid-wave-b" filter="url(#hero-wave-blur)" opacity="0.88">
          <path
            d="M1560 920 C 1220 480, 900 360, 620 300 C 380 250, 180 200, -80 120 L -80 920 Z"
            fill="url(#hero-wave-b)"
          />
        </g>

        <g className="hero-fluid-wave hero-fluid-wave-c" filter="url(#hero-wave-blur-soft)" opacity="0.75">
          <path
            d="M200 920 C 380 620, 520 480, 720 400 C 900 330, 1080 280, 1320 220 L 1320 920 Z"
            fill="url(#hero-wave-c)"
          />
        </g>
      </svg>
    </div>
  )
}
