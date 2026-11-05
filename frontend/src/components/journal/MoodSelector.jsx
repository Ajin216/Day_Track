import { MOODS, MOOD_CONFIG } from './journalConstants'

export default function MoodSelector({ value, onChange, disabled = false }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
        {MOODS.map((mood) => {
          const config = MOOD_CONFIG[mood]
          const Icon = config.icon
          const isSelected = value === mood

          return (
            <button
              key={mood}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mood)}
              className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                isSelected
                  ? config.selected
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : config.color}`} />
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
