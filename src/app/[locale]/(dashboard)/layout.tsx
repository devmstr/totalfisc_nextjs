import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { TenantProvider } from '@/lib/contexts/tenant-context'
import { AppShell } from '@/components/layout/app-shell'

export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect(`/${locale}/login`)
  }

  // Fetch all tenants the user has access to
  // For the MVP, we might just have one organization and multiple tenants
  // Let's fetch tenants for the user's organization
  const tenants = await prisma.tenant.findMany({
    where: {
      organizationId: session.user.organizationId
    },
    select: {
      id: true,
      companyName: true,
      logo: true,
      fiscalYear: true,
      currency: true,
      nif: true
    }
  })

  return (
    <TenantProvider
      initialTenants={tenants}
      initialTenantId={session.user.tenantId}
    >
      <AppShell>{children}</AppShell>
    </TenantProvider>
  )
}
