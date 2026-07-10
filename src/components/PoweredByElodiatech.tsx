export default function PoweredByElodiatech({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-slate-400">Propulsé par</span>
      <img src="/elodiatech-logo.webp" alt="Elodiatech" className="h-4 w-auto opacity-70" />
    </div>
  )
}
