import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEN from '@/locales/en/common.json';
import memberEN from '@/locales/en/member.json';
import artistEN from '@/locales/en/artist.json';
import authEN from '@/locales/en/auth.json';

import commonES from '@/locales/es/common.json';
import memberES from '@/locales/es/member.json';
import artistES from '@/locales/es/artist.json';
import authES from '@/locales/es/auth.json';

import commonFR from '@/locales/fr/common.json';
import memberFR from '@/locales/fr/member.json';
import artistFR from '@/locales/fr/artist.json';
import authFR from '@/locales/fr/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEN,
        member: memberEN,
        artist: artistEN,
        auth: authEN,
      },
      es: {
        common: commonES,
        member: memberES,
        artist: artistES,
        auth: authES,
      },
      fr: {
        common: commonFR,
        member: memberFR,
        artist: artistFR,
        auth: authFR,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
