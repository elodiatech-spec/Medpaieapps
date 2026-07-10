export default function PoweredByElodiatech({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="text-[11px] text-slate-500">Propulsé par</span>
      <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-deep">
        <img src="/elodiatech-logo.webp" alt="Elodiatech" className="h-4 w-auto" />
      </span>
    </div>
  )
}
