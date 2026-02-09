import type { Metadata } from 'next'
import { Inter, Noto_Sans_Arabic } from 'next/font/google'
import Providers from '@/components/providers'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing, Locale } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import '@/styles/index.css'

export const metadata: Metadata = {
  title: 'TOTALFisc | Algerian Accounting SaaS',
  description: 'Modern accounting platform compliant with the Algerian SCF.'
}

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'


  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${locale === 'ar' ? 'font-somar' : 'font-poppins'} font-sans`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
