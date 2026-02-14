import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import tj from "./locales/tj.json";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  tj: { translation: tj },
};

const savedLang = typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null;
const defaultLng = savedLang && resources[savedLang] ? savedLang : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLng,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
