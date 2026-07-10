import type { ReactNode } from 'react'

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  stat,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  stat?: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-deep sm:p-8">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 85% 0%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 10% 100%, rgba(255,255,255,0.10), transparent 50%)',
        }}
      />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-brand-100">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-brand-100">{subtitle}</p>}
        </div>
        {stat && <div className="shrink-0">{stat}</div>}
      </div>
    </div>
  )
}
