import { ref, computed } from 'vue';
import en from '@/locales/en';
import ar from '@/locales/ar';

export type Locale = 'en' | 'ar';

const LANG_KEY = 'drugza_lang';

const messages: Record<Locale, any> = {
  en,
  ar
};

const savedLocale = (localStorage.getItem(LANG_KEY) as Locale) || 'en';
const currentLocale = ref<Locale>(savedLocale === 'ar' ? 'ar' : 'en');

function updateHtmlDirection(lang: Locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

// Initial sync
updateHtmlDirection(currentLocale.value);

export function useI18n() {
  const isRtl = computed(() => currentLocale.value === 'ar');

  function t(path: string, params?: Record<string, any>): string {
    const keys = path.split('.');
    let value: any = messages[currentLocale.value];

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English
        let fallbackVal: any = messages.en;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return path;
          }
        }
        value = fallbackVal;
        break;
      }
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
    }

    return value;
  }

  function setLocale(newLocale: Locale) {
    currentLocale.value = newLocale;
    localStorage.setItem(LANG_KEY, newLocale);
    updateHtmlDirection(newLocale);
  }

  function toggleLocale() {
    setLocale(currentLocale.value === 'ar' ? 'en' : 'ar');
  }

  return {
    locale: currentLocale,
    isRtl,
    t,
    setLocale,
    toggleLocale
  };
}
