'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing, Locale } from '@/i18n/routing'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleChange = (newLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <div className="flex items-center p-1 bg-slate-100 rounded-full border border-slate-200 shadow-inner overflow-hidden">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc)}
          disabled={isPending || loc === locale}
          className={cn(
            'relative px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center gap-2',
            loc === locale
              ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          )}
        >
          {loc === 'fr' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              FR
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              عربي
            </>
          )}
          {isPending && loc !== locale && (
            <div className="absolute inset-0 bg-white/60 animate-pulse rounded-full"></div>
          )}
        </button>
      ))}
    </div>
  )
}
