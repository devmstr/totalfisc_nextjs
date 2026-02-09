import { useTranslations as useNextIntlTranslations } from 'next-intl';

/**
 * Standard hook for translations as per UI component standards.
 * Wraps next-intl useTranslations for consistency.
 */
export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}
