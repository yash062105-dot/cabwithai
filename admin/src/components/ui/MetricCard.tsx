import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  note?: string
  icon?: ReactNode
  color?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'
}

export function MetricCard({ label, value, note, icon, color = 'blue' }: MetricCardProps) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200',
    },
    violet: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-200',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-200',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'hover:border-rose-200',
    },
  }

  const activeColor = colorMap[color]

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${activeColor.border} flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeColor.bg}`}>
            {icon}
          </div>
        )}
      </div>
      {note && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
          <span>{note}</span>
        </div>
      )}
    </div>
  )
}
