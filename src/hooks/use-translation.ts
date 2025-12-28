import { useLanguageStore } from "@/stores/language";
import { translations } from "@/lib/i18n/translations";
import type { TranslationKey } from "@/lib/i18n/translations";

export const useTranslation = () => {
  const { language } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language };
};
