const STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-amber-100 text-amber-700',
  validated: 'bg-brand-100 text-brand-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-100 text-red-700',
  sent: 'bg-brand-100 text-brand-700',
  paid: 'bg-brand-100 text-brand-700',
}

const LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  validated: 'Validé',
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
  sent: 'Envoyée',
  paid: 'Payée',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STYLES[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  )
}
