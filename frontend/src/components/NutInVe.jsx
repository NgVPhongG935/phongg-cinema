import { Printer } from 'lucide-react'

export default function NutInVe({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-violet-500 ${className}`}
    >
      <Printer size={16} />
      In Vé
    </button>
  )
}
