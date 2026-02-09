import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import prisma from "@/lib/prisma";
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from "@/components/ui/language-switcher";
import { Session } from "next-auth";

export default async function DashboardPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session: Session | null = await getServerSession(authOptions);
    const t = await getTranslations('dashboard');

    if (!session) {
        redirect({ href: '/login', locale: locale });
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session?.user.tenantId },
    });

    const stats = [
        { label: t('revenue'), value: "0,00 DA", color: "text-green-600" },
        { label: t('expenses'), value: "0,00 DA", color: "text-red-600" },
        { label: t('vatToPay'), value: "0,00 DA", color: "text-orange-600" },
        { label: t('netResult'), value: "0,00 DA", color: "text-blue-600" },
    ];

    const shortcuts = [
        t('newInvoice'),
        t('newEntry'),
        t('viewBalance'),
        t('generateG50'),
    ];

    return (
        <div className="p-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {t('title')}
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {t('welcome', { name: session?.user.name ?? '' })} ({tenant?.companyName || ''})
                    </p>
                </div>
                <LanguageSwitcher />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold mb-4">{t('recentActivity')}</h2>
                    <div className="text-sm text-zinc-500 italic">{t('noRecentActivity')}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold mb-4">{t('shortcuts')}</h2>
                    <div className="space-y-2">
                        {shortcuts.map((action, i) => (
                            <button key={i} className="w-full text-start px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
