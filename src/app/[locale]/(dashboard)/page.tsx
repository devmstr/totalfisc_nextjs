import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from '@/i18n/navigation'
import prisma from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/ui/language-switcher'
import { Session } from 'next-auth'

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session: Session | null = await getServerSession(authOptions)
  const t = await getTranslations('dashboard')

  if (!session) {
    redirect({ href: '/login', locale: locale })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session?.user.tenantId }
  })

  const stats = [
    { label: t('revenue'), value: '0,00 DA', color: 'text-green-600' },
    { label: t('expenses'), value: '0,00 DA', color: 'text-red-600' },
    { label: t('vatToPay'), value: '0,00 DA', color: 'text-orange-600' },
    { label: t('netResult'), value: '0,00 DA', color: 'text-blue-600' }
  ]

  const shortcuts = [
    t('newInvoice'),
    t('newEntry'),
    t('viewBalance'),
    t('generateG50')
  ]

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="animate-in fade-in slide-in-from-left duration-500">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {t('welcome', { name: session?.user.name ?? '' })} •{' '}
            <span className="font-semibold text-emerald-600">
              {tenant?.companyName || ''}
            </span>
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom duration-700">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-slate-50 to-transparent -mr-8 -mt-8 rounded-full opacity-50 group-hover:from-emerald-50 transition-colors"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {stat.label}
            </p>
            <p
              className={`text-2xl font-black ${stat.color} transition-transform group-hover:scale-105 origin-left`}
            >
              {stat.value}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span className="text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">
                +0.0%
              </span>{' '}
              vs mois dernier
            </div>
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 border-l-4 border-emerald-500 pl-4">
              {t('recentActivity')}
            </h2>
            <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
              Voir tout
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
              <h1 className="text-2xl font-bold">∅</h1>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {t('noRecentActivity')}
            </p>
            <button className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Commencer une action
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs">
                ⚡
              </span>
              {t('shortcuts')}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {shortcuts.map((action, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-4 text-sm font-semibold rounded-xl bg-slate-50 hover:bg-emerald-500 hover:text-white group border border-slate-100 hover:border-emerald-400 transition-all duration-300"
                >
                  {action}
                  <span className="text-xl transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-linear-to-br from-emerald-600 to-teal-700 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <h3 className="text-lg font-bold mb-2">Besoin d'aide ficale ?</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6">
              Nos experts sont disponibles pour vous accompagner dans vos
              déclarations.
            </p>
            <button className="w-full py-3 bg-white text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors">
              Contacter le support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
