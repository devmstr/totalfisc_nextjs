'use client'

import { useEffect, useState } from 'react'
import { UsageMeter } from '@/components/subscription/usage-meter'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, XIcon, ArrowRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SubscriptionFeatures,
  PLAN_CONFIGS
} from '@/lib/services/subscription.service'
import { useRouter } from 'next/navigation'

// Mock function to simulate data fetching (replace with actual API call)
const fetchSubscription = async () => {
  // In a real app, this would be a fetch to your API
  return {
    status: 'ACTIVE',
    plan: 'STARTER',
    totalPrice: 4990,
    nextPaymentAt: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    currentUsage: {
      currentTenants: 1,
      currentUsers: 2,
      transactionsThisMonth: 150,
      invoicesThisMonth: 20
    },
    limits: PLAN_CONFIGS.STARTER
  }
}

interface SubscriptionData {
  status: string
  plan: string
  totalPrice: number
  nextPaymentAt: string
  currentUsage: {
    currentTenants: number
    currentUsers: number
    transactionsThisMonth: number
    invoicesThisMonth: number
  }
  limits: {
    maxTenants: number
    maxUsers: number
    maxTransactionsPerMonth: number
    maxInvoicesPerMonth: number
    features: SubscriptionFeatures
  }
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchSubscription().then((data) => {
      setSubscription(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8">Chargement...</div>
  if (!subscription) return <div className="p-8">Erreur de chargement</div>

  const features = subscription.limits.features

  const formatFeatureName = (key: string) => {
    const names: Record<string, string> = {
      coreAccounting: 'Comptabilité Générale',
      invoiceManagement: 'Gestion Facturation',
      multiUser: 'Multi-utilisateurs',
      advancedReports: 'Rapports Avancés',
      liasseFiscale: 'Liasse Fiscale',
      customBranding: 'Personnalisation (Logo)',
      apiAccess: 'Accès API',
      multiEntity: 'Multi-entités (Groupe)',
      budgetForecasting: 'Budget Prévisionnel',
      prioritySupport: 'Support Prioritaire'
    }
    return names[key] || key
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'ACTIF',
      TRIAL: 'ESSAI',
      PAST_DUE: 'IMPAYÉ',
      SUSPENDED: 'SUSPENDU',
      CANCELLED: 'ANNULÉ',
      EXPIRED: 'EXPIRÉ'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Abonnement & Facturation
          </h1>
          <p className="text-slate-500 mt-1">
            Gérez votre plan actuel et suivez votre consommation en temps réel.
          </p>
        </div>
        <Badge
          variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
          className="text-sm px-4 py-1.5 rounded-full font-bold bg-emerald-100 text-emerald-700 border-emerald-200"
        >
          {getStatusLabel(subscription.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Votre Plan Actuel</CardTitle>
            <CardDescription>
              Vous êtes abonné au plan{' '}
              <span className="font-bold text-slate-900 underline decoration-emerald-500 underline-offset-4">
                {subscription.plan}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-slate-500 text-sm">Prix mensuel</span>
              <span className="font-bold text-2xl text-slate-900">
                {subscription.totalPrice.toLocaleString('fr-DZ')} DA
                <span className="text-sm font-normal text-slate-400 ml-1">
                  /mois
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Prochaine échéance</span>
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                {new Date(subscription.nextPaymentAt).toLocaleDateString(
                  'fr-FR',
                  { day: 'numeric', month: 'long', year: 'numeric' }
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/30 pt-6">
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-11 transition-all"
              onClick={() => router.push('/settings/subscription/plans')}
            >
              Changer de plan <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Feature List Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Fonctionnalités Incluses</CardTitle>
            <CardDescription>Inclus dans votre forfait actuel</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {Object.entries(features).map(([key, enabled]) => (
                <div key={key} className="flex items-center gap-2.5 text-sm">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                      enabled
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-300'
                    )}
                  >
                    {enabled ? (
                      <CheckIcon className="h-3 w-3 bold" />
                    ) : (
                      <XIcon className="h-3 w-3" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'transition-colors',
                      !enabled
                        ? 'text-slate-400 line-through decoration-slate-200'
                        : 'text-slate-700 font-medium'
                    )}
                  >
                    {formatFeatureName(key)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Metrics Section */}
      <div className="pt-4">
        <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          Suivi de Consommation
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <UsageMeter
            label="Sociétés (Dossiers)"
            current={subscription.currentUsage.currentTenants}
            max={subscription.limits.maxTenants}
          />
          <UsageMeter
            label="Utilisateurs"
            current={subscription.currentUsage.currentUsers}
            max={subscription.limits.maxUsers}
          />
          <UsageMeter
            label="Transactions (Ce mois)"
            current={subscription.currentUsage.transactionsThisMonth}
            max={subscription.limits.maxTransactionsPerMonth}
          />
          <UsageMeter
            label="Factures (Ce mois)"
            current={subscription.currentUsage.invoicesThisMonth}
            max={subscription.limits.maxInvoicesPerMonth}
          />
        </div>
      </div>
    </div>
  )
}
