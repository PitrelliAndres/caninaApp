import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Importar traducciones
import es from '../../assets/locales/es.json'
import en from '../../assets/locales/en.json'

const resources = {
  es: { translation: es },
  en: { translation: en }
}

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    const savedLanguage = await AsyncStorage.getItem('language')
    if (savedLanguage) {
      callback(savedLanguage)
    } else {
      const deviceLanguage = Localization.locale.split('-')[0]
      callback(resources[deviceLanguage] ? deviceLanguage : 'es')
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    await AsyncStorage.setItem('language', language)
  }
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
