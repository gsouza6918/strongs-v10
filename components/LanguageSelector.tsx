import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg px-2 py-1 border border-gray-700">
      <Globe size={16} className="text-gray-400" />
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="bg-transparent text-xs text-gray-300 outline-none cursor-pointer hover:text-white"
      >
        <option value="pt">Português</option>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="id">Indonesia</option>
        <option value="tr">Türkçe</option>
      </select>
    </div>
  );
};
