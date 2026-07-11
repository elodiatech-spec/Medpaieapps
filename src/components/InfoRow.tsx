export default function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-medium text-slate-900">
        {value === null || value === undefined || value === '' ? '—' : value}
      </span>
    </div>
  )
}
