import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-gray-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'de')}
        className="text-sm border-none bg-transparent text-gray-600 focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="en">English</option>
        <option value="de">Deutsch</option>
      </select>
    </div>
  );
}