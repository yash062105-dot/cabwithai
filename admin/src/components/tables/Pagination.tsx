import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Page } from '../../types'

interface PaginationProps {
  result: Page<unknown>
  pageSize: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}

export function Pagination({ result, pageSize, onPage, onPageSize }: PaginationProps) {
  const startItem = result.total === 0 ? 0 : (result.page - 1) * result.page_size + 1
  const endItem = Math.min(result.page * result.page_size, result.total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200/80 bg-slate-50/50">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>
          Showing <strong className="font-semibold text-slate-700">{startItem}</strong> to{' '}
          <strong className="font-semibold text-slate-700">{endItem}</strong> of{' '}
          <strong className="font-semibold text-slate-700">{result.total}</strong> results
        </span>

        <label className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(result.page - 1)}
          disabled={result.page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>
        <span className="text-xs text-slate-600 px-2 font-medium">
          Page {result.page} of {Math.max(result.total_pages, 1)}
        </span>
        <button
          onClick={() => onPage(result.page + 1)}
          disabled={result.page >= result.total_pages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
