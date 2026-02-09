'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Building2, Plus, Calendar } from 'lucide-react'
import { DynamicIcon } from '@/components/ui/icons'
import { useTenant } from '@/lib/contexts/tenant-context'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

export function TenantSwitcher() {
  const { currentTenant, tenants, switchTenant, isPending } = useTenant()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-64 justify-between bg-card border-border hover:bg-slate-50 dark:hover:bg-zinc-800 text-foreground h-auto py-2 px-3 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <DynamicIcon name="Building2" className="w-4 h-4" />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="truncate text-sm font-bold text-foreground leading-none mb-1">
                {currentTenant?.companyName || 'Choisir...'}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <DynamicIcon name="Calendar" className="w-2.5 h-2.5" />
                Exercice {currentTenant?.fiscalYear || '2026'}
              </span>
            </div>
          </div>
          <DynamicIcon
            name="ChevronsUpDown"
            className="ml-2 h-4 w-4 shrink-0 text-slate-400"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-70 p-2 bg-card border-border shadow-2xl rounded-xl"
        align="start"
      >
        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1.5 tracking-wider">
          VOS ENTREPRISES
        </div>
        <div className="mt-1 space-y-1">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => {
                switchTenant(tenant.id)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all group',
                currentTenant?.id === tenant.id
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-transparent'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-md flex items-center justify-center border shrink-0',
                  currentTenant?.id === tenant.id
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              >
                <DynamicIcon name="Building2" className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="truncate font-semibold">
                  {tenant.companyName}
                </span>
                <span className="text-[10px] opacity-60">
                  NIF: {tenant.nif || 'N/A'}
                </span>
              </div>
              {currentTenant?.id === tenant.id && (
                <DynamicIcon
                  name="Check"
                  className="h-4 w-4 text-emerald-500"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-xs h-9 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg gap-2"
            onClick={() => {
              // Navigate to create tenant
              window.location.href = '/tenants/new'
            }}
          >
            <DynamicIcon name="Plus" className="w-4 h-4" />
            Ajouter une entreprise
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
