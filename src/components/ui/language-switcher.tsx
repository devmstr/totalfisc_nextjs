'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, Locale } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleChange = (newLocale: Locale) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
        });
    };

    return (
        <div className="flex items-center gap-2">
            {routing.locales.map((loc) => (
                <button
                    key={loc}
                    onClick={() => handleChange(loc)}
                    disabled={isPending || loc === locale}
                    className={`
            px-3 py-1.5 text-sm font-medium rounded-lg transition-all
            ${loc === locale
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                        }
            ${isPending ? 'opacity-50 cursor-wait' : ''}
          `}
                >
                    {loc === 'fr' ? 'FR' : 'عربي'}
                </button>
            ))}
        </div>
    );
}
