// Marque MedPaie (logo fourni par le client).
export default function Logo({ size = 40 }: { size?: number }) {
  const radius = size * 0.28
  return (
    <img
      src="/medpaie-icon.png"
      alt="MedPaie"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: radius }}
      className="object-cover"
    />
  )
}
