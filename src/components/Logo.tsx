// Marque MedPaie : un tracé de pouls (santé) traversant une carte de paie,
// dans un badge arrondi en dégradé de la couleur de marque.
export default function Logo({ size = 40 }: { size?: number }) {
  const radius = size * 0.28
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="MedPaie"
    >
      <defs>
        <linearGradient id="medpaie-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx={radius} fill="url(#medpaie-logo-grad)" />
      <path
        d="M7 22h4l2.5-7 4 14 3-11 2 4h9.5"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
