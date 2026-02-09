'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { DynamicIcon, type Icon } from '@/components/ui/icons'

interface EmptyPageProps {
    titleKey: string
    descriptionKey?: string
    icon?: Icon
}

export function EmptyPage({ titleKey, descriptionKey, icon = 'LayoutDashboard' }: EmptyPageProps) {
    const t = useTranslations('sidebar')

    return (
        <div className="space-y-10 pb-10 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-500/20">
                        <DynamicIcon name={icon} className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {t(titleKey)}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {descriptionKey ? t(descriptionKey) : "Cette section est en cours de développement."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-dashed border-slate-200 bg-slate-50/50 shadow-none rounded-3xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6 border border-slate-100 animate-bounce duration-1000">
                        <DynamicIcon name="Activity" className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Espace de travail en préparation</h2>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                        Nous préparons l'interface de <strong>{t(titleKey).toLowerCase()}</strong>.
                        Bientôt, vous pourrez gérer toutes vos opérations ici avec une fluidité exceptionnelle.
                    </p>

                    <div className="mt-8 flex gap-3">
                        <div className="h-1.5 w-8 rounded-full bg-emerald-500"></div>
                        <div className="h-1.5 w-2 rounded-full bg-slate-200"></div>
                        <div className="h-1.5 w-2 rounded-full bg-slate-200"></div>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                        <CardContent className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs">⚡</span>
                                Actions rapides
                            </h3>
                            <div className="space-y-3">
                                <button className="w-full py-4 px-5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between group/btn border border-white/5">
                                    Initialiser la section
                                    <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                                </button>
                                <button className="w-full py-4 px-5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold text-left transition-all flex items-center justify-between group/btn border border-white/5">
                                    Consulter la documentation
                                    <span className="transition-transform group-hover/btn:translate-x-1">→</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 rounded-3xl shadow-sm p-8">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Prochaines étapes</h4>
                        <ul className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <li key={i} className="flex gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">{i}</div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full mt-1.5 skew-x-12"></div>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
