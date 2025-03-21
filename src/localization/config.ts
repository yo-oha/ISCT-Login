import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import ja from './ja.json'
import en from './en.json'

const resources = {
  ja: {
    translation: ja,
  },
  en: {
    translation: en,
  },
}

i18next.use(initReactI18next).init({
  resources,
  lng: 'ja',
  interpolation: {
    escapeValue: false,
  },
})

export { i18next }
