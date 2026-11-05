import { SmilePlus, Smile, Meh, Frown, HeartCrack } from 'lucide-react'

export const MOODS = ['Excellent', 'Good', 'Okay', 'Bad', 'Terrible']

export const MOOD_CONFIG = {
  Excellent: {
    label: 'Excellent',
    icon: SmilePlus,
    color: 'text-emerald-600 dark:text-emerald-400',
    selected: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60',
    dot: 'bg-emerald-500',
  },
  Good: {
    label: 'Good',
    icon: Smile,
    color: 'text-blue-600 dark:text-blue-400',
    selected: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60',
    dot: 'bg-blue-500',
  },
  Okay: {
    label: 'Okay',
    icon: Meh,
    color: 'text-amber-600 dark:text-amber-400',
    selected: 'bg-amber-500 text-white border-amber-500 shadow-xs',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60',
    dot: 'bg-amber-500',
  },
  Bad: {
    label: 'Bad',
    icon: Frown,
    color: 'text-orange-600 dark:text-orange-400',
    selected: 'bg-orange-500 text-white border-orange-500 shadow-xs',
    badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-900/60',
    dot: 'bg-orange-500',
  },
  Terrible: {
    label: 'Terrible',
    icon: HeartCrack,
    color: 'text-rose-600 dark:text-rose-400',
    selected: 'bg-rose-600 text-white border-rose-600 shadow-xs',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60',
    dot: 'bg-rose-500',
  },
}

