'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowUpIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradeBannerProps {
  message: string
  feature?: string
}

export function UpgradeBanner({ message, feature }: UpgradeBannerProps) {
  const router = useRouter()

  return (
    <Alert className="border-orange-500 bg-orange-50 text-orange-900">
      <ArrowUpIcon className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Mise à niveau requise</AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-2">
        <span>{message}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push('/settings/subscription')}
          className="ml-4 border-orange-200 hover:bg-orange-100 hover:text-orange-900"
        >
          Voir les plans
        </Button>
      </AlertDescription>
    </Alert>
  )
}
