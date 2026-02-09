'use client'

import { Bell, Search, User, LogOut, ChevronDown, Settings } from 'lucide-react'
import LanguageSwitcher from '@/components/ui/language-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useSession, signOut } from 'next-auth/react'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
      {/* Search Bar - Visual only for now */}
      <div className="hidden md:flex flex-1 max-w-md ml-8 lg:ml-0">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher une facture, un client..."
            className="w-full h-10 pl-10 pr-4 bg-slate-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 rounded-xl text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 ml-auto lg:ml-0">
        <LanguageSwitcher />

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-emerald-600 rounded-full h-9 w-9"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
        </Button>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 pl-1 pr-2 rounded-full hover:bg-slate-100 transition-all h-10 group"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs ring-2 ring-emerald-500/10 group-hover:ring-emerald-500/30 transition-all">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold text-slate-700 leading-none mb-1">
                  {session?.user?.name || 'Utilisateur'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {session?.user?.role || 'Administrateur'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-xl shadow-xl border-slate-200"
          >
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg p-2.5 cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Réglages</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg p-2.5 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
