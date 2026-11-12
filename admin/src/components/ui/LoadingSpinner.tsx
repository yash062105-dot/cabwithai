interface LoadingSpinnerProps {
  label?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ label = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-3">
        <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>
      </div>
    )
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-3">
      <div className="w-8 h-8 border-2 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
