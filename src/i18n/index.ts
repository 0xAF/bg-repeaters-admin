import { createI18n } from 'vue-i18n';
import en from './en';
import bg from './bg';

export const SUPPORTED_LANGUAGES = [
    { code: 'bg', label: 'Български', shortLabel: 'BG' },
    { code: 'en', label: 'English', shortLabel: 'EN' },
] as const;

export type LocaleCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

type Messages = {
    bg: typeof bg;
    en: typeof en;
};

const messages: Messages = {
    bg,
    en,
};

const STORAGE_KEY = 'bgreps:locale';

function isSupportedLocale(locale?: string | null): locale is LocaleCode {
    return Boolean(locale && SUPPORTED_LANGUAGES.some((lang) => lang.code === locale));
}

function getStoredLocale(): LocaleCode | null {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSupportedLocale(stored) ? stored : null;
}

function inferLocaleFromNavigator(): LocaleCode {
    if (typeof navigator === 'undefined') return 'en';
    const languages = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
    for (const lang of languages) {
        if (typeof lang !== 'string') continue;
        if (lang.toLowerCase().startsWith('bg')) return 'bg';
    }
    return 'en';
}

const initialLocale: LocaleCode = getStoredLocale() ?? inferLocaleFromNavigator();

export const i18n = createI18n({
    legacy: false,
    locale: initialLocale,
    fallbackLocale: 'en',
    messages,
});

export function setLocale(locale: LocaleCode) {
    if (!isSupportedLocale(locale)) return;
    i18n.global.locale.value = locale;
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, locale);
    }
}

export function getLocale(): LocaleCode {
    return i18n.global.locale.value as LocaleCode;
}

export function initLocale() {
    const stored = getStoredLocale();
    if (stored) {
        setLocale(stored);
    } else if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, getLocale());
    }
}

export default i18n;
