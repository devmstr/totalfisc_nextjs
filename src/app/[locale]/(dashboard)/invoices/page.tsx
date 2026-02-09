import { EmptyPage } from '@/components/layout/empty-page'

export default async function Page() {
  return (
    <EmptyPage
      titleKey="Invoices"
      icon="Send"
      action={{
        label: 'Create Invoice',
        href: '/invoices/new'
      }}
    />
  )
}
