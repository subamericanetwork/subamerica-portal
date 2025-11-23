import { format as dateFnsFormat } from 'date-fns';
import { enUS, es, fr } from 'date-fns/locale';

const locales = {
  en: enUS,
  es: es,
  fr: fr,
};

export function formatDate(date: Date | string | number, formatStr: string, language: string = 'en'): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const locale = locales[language as keyof typeof locales] || locales.en;
  
  return dateFnsFormat(dateObj, formatStr, { locale });
}

export function formatNumber(value: number, language: string = 'en'): string {
  return new Intl.NumberFormat(language).format(value);
}

export function formatCurrency(value: number, currency: string = 'USD', language: string = 'en'): string {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency,
  }).format(value);
}
