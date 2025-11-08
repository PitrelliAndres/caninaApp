/**
 * Localization Service - Native React Native implementation
 * Replaces expo-localization with react-native-localize
 */

import {
  getLocales,
  getNumberFormatSettings,
  getCalendar,
  getCountry,
  getCurrencies,
  getTemperatureUnit,
  getTimeZone,
  uses24HourClock,
  usesMetricSystem,
  usesAutoDateAndTime,
  usesAutoTimeZone,
} from 'react-native-localize';

class LocalizationService {
  constructor() {
    this.cachedLocales = null;
    this.cachedSettings = null;
    this.initializeLocalization();
  }

  /**
   * Initialize and cache localization data
   */
  initializeLocalization() {
    try {
      this.cachedLocales = getLocales();
      this.cachedSettings = this.getFullLocalizationInfo();
    } catch (error) {
      console.warn('Error initializing localization:', error);
      this.setFallbackLocalization();
    }
  }

  /**
   * Set fallback localization for errors
   */
  setFallbackLocalization() {
    this.cachedLocales = [
      {
        languageCode: 'en',
        countryCode: 'US',
        languageTag: 'en-US',
        isRTL: false,
      }
    ];
    this.cachedSettings = {
      locale: 'en-US',
      locales: this.cachedLocales,
      timezone: 'America/New_York',
      isRTL: false,
      isMetric: true,
    };
  }

  /**
   * Get device locales (equivalent to expo-localization getLocalizationAsync)
   */
  getLocalizationAsync() {
    try {
      const locales = getLocales();
      const primaryLocale = locales[0];

      return {
        locale: primaryLocale.languageTag,
        locales: locales.map(locale => locale.languageTag),
        timezone: getTimeZone(),
        isRTL: primaryLocale.isRTL,
        region: getCountry(),
        // Additional info
        isMetric: usesMetricSystem(),
        uses24HourClock: uses24HourClock(),
        currency: getCurrencies()[0] || 'USD',
        temperatureUnit: getTemperatureUnit(),
        calendar: getCalendar(),
      };
    } catch (error) {
      console.warn('Error getting localization:', error);
      return this.cachedSettings;
    }
  }

  /**
   * Get device locale (simple format)
   */
  getLocale() {
    try {
      const locales = getLocales();
      return locales[0]?.languageTag || 'en-US';
    } catch (error) {
      console.warn('Error getting locale:', error);
      return 'en-US';
    }
  }

  /**
   * Get all device locales
   */
  getLocales() {
    try {
      return getLocales();
    } catch (error) {
      console.warn('Error getting locales:', error);
      return this.cachedLocales;
    }
  }

  /**
   * Get primary language code (e.g., 'en', 'es')
   */
  getLanguageCode() {
    try {
      const locales = getLocales();
      return locales[0]?.languageCode || 'en';
    } catch (error) {
      console.warn('Error getting language code:', error);
      return 'en';
    }
  }

  /**
   * Get primary country code (e.g., 'US', 'ES')
   */
  getCountryCode() {
    try {
      const locales = getLocales();
      return locales[0]?.countryCode || getCountry() || 'US';
    } catch (error) {
      console.warn('Error getting country code:', error);
      return 'US';
    }
  }

  /**
   * Get timezone
   */
  getTimeZone() {
    try {
      return getTimeZone();
    } catch (error) {
      console.warn('Error getting timezone:', error);
      return 'UTC';
    }
  }

  /**
   * Check if device uses RTL layout
   */
  isRTL() {
    try {
      const locales = getLocales();
      return locales[0]?.isRTL || false;
    } catch (error) {
      console.warn('Error checking RTL:', error);
      return false;
    }
  }

  /**
   * Check if device uses metric system
   */
  isMetric() {
    try {
      return usesMetricSystem();
    } catch (error) {
      console.warn('Error checking metric system:', error);
      return true; // Default to metric
    }
  }

  /**
   * Check if device uses 24-hour clock
   */
  uses24HourClock() {
    try {
      return uses24HourClock();
    } catch (error) {
      console.warn('Error checking 24-hour clock:', error);
      return true; // Default to 24-hour
    }
  }

  /**
   * Get currency information
   */
  getCurrencies() {
    try {
      return getCurrencies();
    } catch (error) {
      console.warn('Error getting currencies:', error);
      return ['USD'];
    }
  }

  /**
   * Get primary currency
   */
  getPrimaryCurrency() {
    try {
      const currencies = getCurrencies();
      return currencies[0] || 'USD';
    } catch (error) {
      console.warn('Error getting primary currency:', error);
      return 'USD';
    }
  }

  /**
   * Get temperature unit
   */
  getTemperatureUnit() {
    try {
      return getTemperatureUnit();
    } catch (error) {
      console.warn('Error getting temperature unit:', error);
      return 'celsius';
    }
  }

  /**
   * Get calendar system
   */
  getCalendar() {
    try {
      return getCalendar();
    } catch (error) {
      console.warn('Error getting calendar:', error);
      return 'gregorian';
    }
  }

  /**
   * Get number format settings
   */
  getNumberFormatSettings() {
    try {
      return getNumberFormatSettings();
    } catch (error) {
      console.warn('Error getting number format settings:', error);
      return {
        decimalSeparator: '.',
        groupingSeparator: ',',
      };
    }
  }

  /**
   * Check date/time auto settings
   */
  getDateTimeSettings() {
    try {
      return {
        usesAutoDateAndTime: usesAutoDateAndTime(),
        usesAutoTimeZone: usesAutoTimeZone(),
        uses24HourClock: uses24HourClock(),
      };
    } catch (error) {
      console.warn('Error getting date/time settings:', error);
      return {
        usesAutoDateAndTime: true,
        usesAutoTimeZone: true,
        uses24HourClock: true,
      };
    }
  }

  /**
   * Get comprehensive localization info
   */
  getFullLocalizationInfo() {
    try {
      const locales = this.getLocales();
      const primaryLocale = locales[0];

      return {
        // Primary locale info
        locale: primaryLocale?.languageTag || 'en-US',
        languageCode: primaryLocale?.languageCode || 'en',
        countryCode: primaryLocale?.countryCode || 'US',
        isRTL: primaryLocale?.isRTL || false,
        
        // All locales
        locales: locales,
        
        // Regional settings
        timezone: this.getTimeZone(),
        region: getCountry(),
        
        // Measurement preferences
        isMetric: this.isMetric(),
        temperatureUnit: this.getTemperatureUnit(),
        
        // Time preferences
        uses24HourClock: this.uses24HourClock(),
        dateTimeSettings: this.getDateTimeSettings(),
        
        // Currency and numbers
        currencies: this.getCurrencies(),
        primaryCurrency: this.getPrimaryCurrency(),
        numberFormat: this.getNumberFormatSettings(),
        
        // Calendar
        calendar: this.getCalendar(),
      };
    } catch (error) {
      console.warn('Error getting full localization info:', error);
      return this.cachedSettings;
    }
  }

  /**
   * Find best matching locale from supported list
   */
  findBestAvailableLanguage(supportedLanguages) {
    try {
      const deviceLocales = this.getLocales();
      
      for (const deviceLocale of deviceLocales) {
        // Check exact match first (language-country)
        const exactMatch = supportedLanguages.find(
          lang => lang.toLowerCase() === deviceLocale.languageTag.toLowerCase()
        );
        if (exactMatch) {
          return {
            languageTag: exactMatch,
            isRTL: deviceLocale.isRTL,
          };
        }
        
        // Check language code match
        const languageMatch = supportedLanguages.find(
          lang => lang.toLowerCase().startsWith(deviceLocale.languageCode.toLowerCase())
        );
        if (languageMatch) {
          return {
            languageTag: languageMatch,
            isRTL: deviceLocale.isRTL,
          };
        }
      }
      
      // Return first supported language as fallback
      return {
        languageTag: supportedLanguages[0] || 'en',
        isRTL: false,
      };
    } catch (error) {
      console.warn('Error finding best available language:', error);
      return {
        languageTag: supportedLanguages[0] || 'en',
        isRTL: false,
      };
    }
  }

  /**
   * Format locale for i18next
   */
  getI18nLocale() {
    try {
      const locale = this.getLocale();
      // Convert locale format (en-US -> en_US for some i18n libraries)
      return locale.replace('-', '_');
    } catch (error) {
      console.warn('Error getting i18n locale:', error);
      return 'en_US';
    }
  }

  /**
   * Get locale for date formatting libraries
   */
  getDateLocale() {
    try {
      const locale = this.getLocale();
      // Return in format expected by date-fns and similar libraries
      return locale.replace('_', '-');
    } catch (error) {
      console.warn('Error getting date locale:', error);
      return 'en-US';
    }
  }

  /**
   * Check if device locale matches a specific language
   */
  isLanguage(languageCode) {
    try {
      const deviceLanguage = this.getLanguageCode();
      return deviceLanguage.toLowerCase() === languageCode.toLowerCase();
    } catch (error) {
      console.warn('Error checking language:', error);
      return false;
    }
  }

  /**
   * Check if device locale matches a specific region
   */
  isRegion(countryCode) {
    try {
      const deviceCountry = this.getCountryCode();
      return deviceCountry.toLowerCase() === countryCode.toLowerCase();
    } catch (error) {
      console.warn('Error checking region:', error);
      return false;
    }
  }

  /**
   * Get formatted locale info for analytics
   */
  getAnalyticsLocale() {
    try {
      const info = this.getFullLocalizationInfo();
      return {
        locale: info.locale,
        language: info.languageCode,
        country: info.countryCode,
        timezone: info.timezone,
        isRTL: info.isRTL,
        isMetric: info.isMetric,
      };
    } catch (error) {
      console.warn('Error getting analytics locale:', error);
      return {
        locale: 'en-US',
        language: 'en',
        country: 'US',
        timezone: 'UTC',
        isRTL: false,
        isMetric: true,
      };
    }
  }
}

// Export singleton instance
export const localizationService = new LocalizationService();
export default localizationService;
