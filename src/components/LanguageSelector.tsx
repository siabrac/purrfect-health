import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-gray-500" />
      <select
        value={i18n.language}
        onChange={(e) => setLanguage(e.target.value)}
        className="text-sm border-none bg-transparent text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  );
}