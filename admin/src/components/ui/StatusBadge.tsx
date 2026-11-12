interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase()

  let style = 'bg-slate-100 text-slate-700 border-slate-200'

  if (['active', 'completed', 'paid', 'live', 'online'].includes(norm)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-1 ring-emerald-500/10'
  } else if (['inactive', 'unpaid', 'offline', 'requested'].includes(norm)) {
    style = 'bg-slate-100 text-slate-600 border-slate-200'
  } else if (['blocked', 'cancelled', 'failed'].includes(norm)) {
    style = 'bg-rose-50 text-rose-700 border-rose-200/80 ring-1 ring-rose-500/10'
  } else if (['in_progress', 'ongoing', 'accepted'].includes(norm)) {
    style = 'bg-blue-50 text-blue-700 border-blue-200/80 ring-1 ring-blue-500/10'
  } else if (['pending', 'review'].includes(norm)) {
    style = 'bg-amber-50 text-amber-700 border-amber-200/80 ring-1 ring-amber-500/10'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {norm.replace(/_/g, ' ')}
    </span>
  )
}
