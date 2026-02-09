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
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Abonnement & Facturation
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez votre plan actuel et suivez votre consommation.
          </p>
        </div>
        <Badge
          variant={subscription.status === 'ACTIVE' ? 'default' : 'secondary'}
          className="text-lg px-4 py-1"
        >
          {getStatusLabel(subscription.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Votre Plan Actuel</CardTitle>
            <CardDescription>
              Vous êtes abonné au plan <strong>{subscription.plan}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-muted-foreground">Prix mensuel</span>
              <span className="font-bold text-xl">
                {subscription.totalPrice.toLocaleString('fr-DZ')} DA/mois
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-4">
              <span className="text-muted-foreground">Prochaine échéance</span>
              <span>
                {new Date(subscription.nextPaymentAt).toLocaleDateString(
                  'fr-FR'
                )}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push('/settings/subscription/plans')}
            >
              Changer de plan <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Feature List Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Fonctionnalités Incluses in {subscription.plan}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(features).map(([key, enabled]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {enabled ? (
                    <CheckIcon className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XIcon className="h-4 w-4 text-gray-300 shrink-0" />
                  )}
                  <span
                    className={
                      !enabled
                        ? 'text-muted-foreground line-through decoration-gray-300'
                        : ''
                    }
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
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-primary">
          Consommation
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
