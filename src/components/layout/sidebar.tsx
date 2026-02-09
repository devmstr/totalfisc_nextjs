'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenant } from '@/lib/contexts/tenant-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLocale, useTranslations } from 'next-intl'
import { type Icon, DynamicIcon } from '@/components/ui/icons'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'gestion' | 'comptabilite'

interface NavItem {
  name: string
  icon: Icon
  badge?: string
  items: {
    name: string
    href: string
    badge?: string
  }[]
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('sidebar')
  const isRtl = locale === 'ar'
  const { currentTenant } = useTenant()
  const [viewMode, setViewMode] = useState<ViewMode>('gestion')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    )
  }

  const gestionNavigation: NavItem[] = [
    {
      name: t('Monitoring'),
      icon: 'BarChart3',
      items: [
        { name: t('Dashboard'), href: '/' },
        { name: t('Indicators'), href: '/reports' }
      ]
    },
    {
      name: t('Sales'),
      icon: 'Send',
      items: [
        { name: t('Invoices'), href: '/invoices' },
        { name: t('Quotes'), href: '/quotes' },
        { name: t('Credit Notes'), href: '/credit-notes' },
        { name: t('Follow-ups'), href: '/follow-ups' }
      ]
    },
    {
      name: t('Purchases'),
      icon: 'Receipt',
      items: [
        { name: t('Expenses'), href: '/expenses' },
        { name: t('Expense Claims'), href: '/expense-claims' },
        { name: t('Suppliers'), href: '/suppliers' }
      ]
    },
    {
      name: t('Treasury'),
      icon: 'Landmark',
      items: [
        { name: t('Bank'), href: '/bank' },
        { name: t('Cash'), href: '/cash' },
        { name: t('Reconciliation'), href: '/reconciliation' }
      ]
    },
    {
      name: t('Contacts'),
      icon: 'Users',
      items: [
        { name: t('Clients'), href: '/auxiliaries' },
        { name: t('Suppliers'), href: '/contacts/suppliers' }
      ]
    }
  ]

  const comptabiliteNavigation: NavItem[] = [
    {
      name: t('Dashboard'),
      icon: 'Home',
      items: [
        { name: t('Summary'), href: '/accounting/summary' },
        { name: t('Deadlines'), href: '/accounting/deadlines' }
      ]
    },
    {
      name: t('Entry'),
      icon: 'PenLine',
      items: [
        { name: t('By Journal'), href: '/journals' },
        { name: t('Guided Entry'), href: '/accounting/entry/guided' },
        { name: t('Import'), href: '/accounting/entry/import' }
      ]
    },
    {
      name: t('Ledger Management'),
      icon: 'Notebook',
      items: [
        { name: t('Journals'), href: '/accounting/ledger/journals' },
        {
          name: t('General Ledger'),
          href: '/accounting/ledger/general-ledger'
        },
        { name: t('Balance'), href: '/accounting/ledger/balance' },
        { name: t('Matching'), href: '/accounting/ledger/reconciliation' }
      ]
    },
    {
      name: t('Assets'),
      icon: 'Factory',
      items: [
        { name: t('Assets Registry'), href: '/investments' },
        { name: t('Depreciation'), href: '/accounting/assets/depreciation' },
        { name: t('Depreciation Entries'), href: '/accounting/assets/entries' }
      ]
    },
    {
      name: t('Tax'),
      icon: 'Building2',
      items: [
        { name: t('Tax Returns'), href: '/g50', badge: 'Due' },
        { name: t('Fiscal Report'), href: '/accounting/tax/returns' },
        { name: t('Mapping'), href: '/accounting/tax/mapping' }
      ]
    },
    {
      name: t('Configuration'),
      icon: 'Settings2',
      items: [
        { name: t('Chart of Accounts'), href: '/settings/coa' },
        { name: t('Auxiliaries'), href: '/settings/auxiliaries' },
        { name: t('Journals'), href: '/settings/journals' },
        { name: t('Company Folder'), href: '/settings/company' },
        { name: t('Users'), href: '/settings/users' }
      ]
    }
  ]

  const navigation = useMemo(
    () => (viewMode === 'gestion' ? gestionNavigation : comptabiliteNavigation),
    [viewMode]
  )

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true
    if (path !== '/' && pathname.startsWith(path)) return true
    return false
  }

  // Pre-expand active items on load and when navigation changes
  useEffect(() => {
    const activeParent = navigation.find((parent) =>
      parent.items.some((item) => isActive(item.href))
    )
    if (activeParent && !expandedItems.includes(activeParent.name)) {
      setExpandedItems((prev) => [...prev, activeParent.name])
    }
  }, [pathname, navigation])

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'fixed inset-y-0 z-40 w-64 bg-linear-to-br from-emerald-600 to-teal-700  transition-transform duration-300 ease-in-out lg:translate-x-0',
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

          {/* View Mode Toggle */}
          <div className="px-4 mt-6 mb-4">
            <div className="flex p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <button
                onClick={() => setViewMode('gestion')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold rounded-md transition-all',
                  viewMode === 'gestion'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <DynamicIcon name="Activity" className="w-3.5 h-3.5" />
                {t('GESTION')}
              </button>
              <button
                onClick={() => setViewMode('comptabilite')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold rounded-md transition-all',
                  viewMode === 'comptabilite'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <DynamicIcon name="ShieldCheck" className="w-3.5 h-3.5" />
                {t('ACCOUNTING')}
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            {navigation.map((group) => {
              const isExpanded = expandedItems.includes(group.name)
              const hasActiveChild = group.items.some((item) =>
                isActive(item.href)
              )

              return (
                <div key={group.name} className="space-y-1">
                  <button
                    onClick={() => toggleExpand(group.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                      hasActiveChild
                        ? 'text-white'
                        : 'text-white/70 hover:bg-slate-800/50 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <DynamicIcon
                        name={group.icon}
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          hasActiveChild
                            ? viewMode === 'gestion'
                              ? 'text-emerald-400'
                              : 'text-blue-400'
                            : 'text-white/70 group-hover:text-white'
                        )}
                      />
                      {group.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-4 pl-3 border-l border-white/70 space-y-1 mt-1">
                      {group.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                              active
                                ? viewMode === 'gestion'
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : 'bg-blue-500/10 text-blue-400'
                                : 'text-white/70 hover:text-white hover:bg-slate-800/30'
                            )}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose()
                            }}
                          >
                            {item.name}
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
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer Navigation */}
          <div className="px-4 py-4 border-t border-slate-800/50 space-y-1">
            <Link
              href="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive('/settings')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <DynamicIcon name="Settings" className="w-4 h-4" />
              {t('Settings')}
            </Link>
            <Link
              href="/support"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive('/support')
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-white'
              )}
            >
              <DynamicIcon name="HelpCircle" className="w-4 h-4" />
              {t('Help & Support')}
            </Link>
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
