'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const isRtl = locale === 'ar'

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  return (
    <div
      className="min-h-screen bg-slate-50 overflow-x-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Toggle button for Mobile */}
      <div
        className={cn(
          'lg:hidden fixed bottom-6 z-50',
          isRtl ? 'left-6' : 'right-6'
        )}
      >
        <Button
          onClick={() => setIsSidebarOpen(true)}
          className="h-14 w-14 rounded-full shadow-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center border-4 border-white"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          isRtl ? 'lg:mr-64' : 'lg:ml-64'
        )}
      >
        {/* Header Component */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Footer info - Senior touch */}
        <footer className="px-8 py-6 border-t border-slate-200 text-slate-400 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            © 2026 TOTALFisc. Tous droits réservés. Conforme au SCF Algérien.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Confidentialité
            </a>
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Conditions
            </a>
            <a href="#" className="hover:text-emerald-600 transition-colors">
              Statut système
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
