import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { localizationService } from "../services/i18n/localizationService";

// Importar traducciones
import es from "./locales/es.json";
import en from "./locales/en.json";

const resources = {
  es: { translation: es },
  en: { translation: en },
};

const supportedLanguages = ['es', 'en'];

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      // Check for saved language first
      const savedLanguage = await AsyncStorage.getItem("language");
      if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
        callback(savedLanguage);
        return;
      }

      // Get device language using our localization service
      const deviceLanguage = localizationService.getLanguageCode();
      const fallbackLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : "es";
      
      callback(fallbackLanguage);
    } catch (error) {
      console.warn('Error detecting language:', error);
      callback("es"); // Fallback to Spanish
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem("language", language);
    } catch (error) {
      console.warn('Error caching user language:', error);
    }
  },
};
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: "v3",
  });
export default i18n;

