'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition
} from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Tenant {
  id: string
  companyName: string
  logo?: string | null
  fiscalYear: number
  currency: string
  nif?: string | null
  role?: string
}

interface TenantContextType {
  currentTenant: Tenant | null
  tenants: Tenant[]
  isLoading: boolean
  isPending: boolean
  switchTenant: (tenantId: string) => Promise<void>
  refreshTenants: () => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({
  children,
  initialTenants,
  initialTenantId
}: {
  children: React.ReactNode
  initialTenants: Tenant[]
  initialTenantId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(() => {
    const tenantIdFromUrl = searchParams.get('tenantId')
    const targetId = tenantIdFromUrl || initialTenantId || initialTenants[0]?.id
    return (
      initialTenants.find((t) => t.id === targetId) || initialTenants[0] || null
    )
  })
  const [isLoading, setIsLoading] = useState(false)

  // Sync URL with current tenant
  useEffect(() => {
    if (currentTenant && searchParams.get('tenantId') !== currentTenant.id) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tenantId', currentTenant.id)
      // Use replace to avoid filling history with tenant switches
      const newUrl = `${pathname}?${params.toString()}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [currentTenant, pathname, searchParams])

  const switchTenant = useCallback(
    async (tenantId: string) => {
      const tenant = tenants.find((t) => t.id === tenantId)

      if (!tenant) return

      startTransition(() => {
        setCurrentTenant(tenant)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tenantId', tenantId)
        router.push(`${pathname}?${params.toString()}`)
        router.refresh()
      })
    },
    [tenants, pathname, router, searchParams]
  )

  const refreshTenants = useCallback(async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be a server action or fetch
      const response = await fetch('/api/tenants')
      const data = await response.json()
      setTenants(data)
    } catch (error) {
      console.error('Failed to refresh tenants:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenants,
        isLoading,
        isPending,
        switchTenant,
        refreshTenants
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}
