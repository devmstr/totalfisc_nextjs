import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Session } from "next-auth";

export default async function DashboardPage() {
    const session: Session | null = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.tenantId },
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    Tableau de Bord
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Bienvenue, {session.user.name} ({tenant?.companyName})
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Quick Stats Placeholder */}
                {[
                    { label: "Chiffre d'Affaires", value: "0,00 DA", color: "text-green-600" },
                    { label: "Charges", value: "0,00 DA", color: "text-red-600" },
                    { label: "TVA à Payer", value: "0,00 DA", color: "text-orange-600" },
                    { label: "Résultat Net", value: "0,00 DA", color: "text-blue-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                        <p className={`text-2xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold mb-4">Activités Récentes</h2>
                    <div className="text-sm text-zinc-500 italic">Aucune activité récente.</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-lg font-semibold mb-4">Raccourcis</h2>
                    <div className="space-y-2">
                        {[
                            "Nouvelle Facture",
                            "Saisir une Écriture",
                            "Consulter la Balance",
                            "Générer un G50",
                        ].map((action, i) => (
                            <button key={i} className="w-full text-left px-4 py-2 text-sm rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
