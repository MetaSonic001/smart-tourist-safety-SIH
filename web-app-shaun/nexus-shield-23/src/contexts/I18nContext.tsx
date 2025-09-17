import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'hi';

const STRINGS: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Command Dashboard',
    incidents: 'Incident Management',
    heatmap: 'Risk Heatmap',
    digitalIds: 'Digital ID Verification',
    zones: 'Zone Management',
    operator: 'Emergency Console',
    audit: 'Audit Logs',
    settings: 'Settings',
    logout: 'Log out',
    profile: 'Profile',
    role: 'Role',
    notifications: 'Notifications',
    language: 'Language',
    mockMode: 'DEMO MODE'
  },
  hi: {
    dashboard: 'कमांड डैशबोर्ड',
    incidents: 'घटना प्रबंधन',
    heatmap: 'जोखिम हीटमैप',
    digitalIds: 'डिजिटल आईडी सत्यापन',
    zones: 'ज़ोन प्रबंधन',
    operator: 'आपातकालीन कंसोल',
    audit: 'ऑडिट लॉग्स',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    profile: 'प्रोफ़ाइल',
    role: 'भूमिका',
    notifications: 'सूचनाएं',
    language: 'भाषा',
    mockMode: 'डेमो मोड'
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: string) => STRINGS[language][key] || key;
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
