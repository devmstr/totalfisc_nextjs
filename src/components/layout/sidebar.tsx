'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Briefcase,
  PieChart,
  Settings,
  HelpCircle,
  Menu,
  X,
  CreditCard,
  Building2,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { TenantSwitcher } from './tenant-switcher'
import { useLocale } from 'next-intl'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const isRtl = locale === 'ar'
  const { currentTenant, tenants, switchTenant, isPending } = useTenant()

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Journaux & Écritures', href: '/journals', icon: BookOpen },
    { name: 'Facturation', href: '/invoices', icon: FileText },
    { name: 'Tiers & Clients', href: '/auxiliaries', icon: Users },
    { name: 'Immobilisations', href: '/investments', icon: Briefcase },
    { name: 'Déclarations G50', href: '/g50', icon: CreditCard, badge: 'Due' },
    { name: 'Rapports', href: '/reports', icon: PieChart }
  ]

  const bottomNavigation = [
    { name: 'Paramètres', href: '/settings', icon: Settings },
    { name: 'Aide & Support', href: '/support', icon: HelpCircle }
  ]

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 z-40 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isRtl ? 'right-0' : 'left-0',
          isOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full'
              : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header/Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <span className="font-bold text-xl">T</span>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                TOTALFisc
              </span>
            </div>
          </div>

          {/* Tenant Switcher Section */}
          <div className="px-4 py-4">
            <TenantSwitcher />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                    Active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose()
                  }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        Active
                          ? 'text-emerald-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    {item.name}
                  </div>
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="h-4 px-1 text-[8px] uppercase font-bold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer Navigation */}
          <div className="px-4 py-4 border-t border-slate-800/50 space-y-1">
            {bottomNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                  isActive(item.href)
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
                )}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose()
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}
