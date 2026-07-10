import { useId, useState } from 'react'

interface Point {
  label: string
  value: number
}

export default function TrendChart({
  title,
  data,
  kind,
  color,
  unit = '',
  height = 180,
}: {
  title: string
  data: Point[]
  kind: 'line' | 'bar'
  color: string
  unit?: string
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const gradientId = useId()

  const width = 640
  const padding = { top: 12, right: 12, bottom: 24, left: 12 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxValue = Math.max(1, ...data.map((d) => d.value))
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0

  function x(i: number) {
    return padding.left + i * (data.length > 1 ? stepX : innerW)
  }
  function y(v: number) {
    return padding.top + innerH - (v / maxValue) * innerH
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.value)}`)
    .join(' ')

  const barWidth = data.length > 0 ? Math.min(24, (innerW / data.length) * 0.6) : 0

  // Barre arrondie uniquement en haut (data-end), carrée sur la ligne de base.
  function roundedTopBarPath(barX: number, barY: number, w: number, h: number) {
    const r = Math.min(4, w / 2, h)
    if (h <= 0) return ''
    return `M ${barX} ${barY + h}
      L ${barX} ${barY + r}
      Q ${barX} ${barY} ${barX + r} ${barY}
      L ${barX + w - r} ${barY}
      Q ${barX + w} ${barY} ${barX + w} ${barY + r}
      L ${barX + w} ${barY + h}
      Z`
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">{title}</h3>
        <button
          onClick={() => setShowTable((s) => !s)}
          className="text-xs font-medium text-slate-400 hover:text-slate-700"
        >
          {showTable ? 'Voir le graphique' : 'Voir en tableau'}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="py-1 pr-4 font-normal">Mois</th>
                <th className="py-1 font-normal">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4 text-slate-600">{d.label}</td>
                  <td className="py-1.5 font-medium text-slate-900">
                    {d.value}
                    {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          role="img"
          aria-label={title}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines (recessive) */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line
              key={f}
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + innerH * (1 - f)}
              y2={padding.top + innerH * (1 - f)}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
          ))}

          {kind === 'line' && (
            <>
              <path
                d={`${linePath} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`}
                fill={`url(#${gradientId})`}
                stroke="none"
              />
              <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
              {data.map((d, i) => (
                <circle
                  key={d.label}
                  cx={x(i)}
                  cy={y(d.value)}
                  r={hover === i ? 6 : 4}
                  fill="white"
                  stroke={color}
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          {kind === 'bar' &&
            data.map((d, i) => {
              const barX = x(i) - barWidth / 2
              const barY = y(d.value)
              const barH = innerH + padding.top - barY
              return (
                <path
                  key={d.label}
                  d={roundedTopBarPath(barX, barY, barWidth, Math.max(barH, 1))}
                  fill={color}
                  opacity={hover === i ? 1 : 0.85}
                />
              )
            })}

          {/* Hover hit targets + x labels (selective) */}
          {data.map((d, i) => (
            <g key={d.label}>
              <rect
                x={x(i) - innerW / Math.max(data.length, 1) / 2}
                y={0}
                width={innerW / Math.max(data.length, 1)}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {(i === 0 || i === data.length - 1 || i === hover) && (
                <text
                  x={x(i)}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-slate-400"
                  fontSize={10}
                >
                  {d.label}
                </text>
              )}
            </g>
          ))}

          {hover !== null && data[hover] && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padding.top}
                y2={padding.top + innerH}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.4}
              />
              <rect
                x={Math.min(Math.max(x(hover) - 42, 0), width - 84)}
                y={padding.top}
                width={84}
                height={20}
                rx={5}
                fill="#0f172a"
              />
              <text
                x={Math.min(Math.max(x(hover), 42), width - 42)}
                y={padding.top + 14}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={500}
              >
                {data[hover].label} — {data[hover].value}
                {unit}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  )
}
