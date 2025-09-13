import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  formatNumber: (value: number, decimals?: number) => string;
  formatDateTime: (date: string | Date) => string;
  formatDate: (date: string | Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();

  const setLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const formatNumber = (value: number, decimals: number = 1): string => {
    if (i18n.language === 'de') {
      return value.toFixed(decimals).replace('.', ',');
    }
    return value.toFixed(decimals);
  };

  const formatDateTime = (date: string | Date): string => {
    const d = new Date(date);
    if (i18n.language === 'de') {
      return d.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    if (i18n.language === 'de') {
      return d.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <LanguageContext.Provider value={{
      language: i18n.language,
      setLanguage,
      t,
      formatNumber,
      formatDateTime,
      formatDate
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}