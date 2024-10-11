import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  sampleRate: number;
  onSampleRateChange: (rate: number) => void;
  onClose: () => void;
  language: 'zh' | 'en';
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  sampleRate,
  onSampleRateChange,
  onClose,
  language,
}) => {
  const sampleRates = [8000, 16000, 22050, 24000, 44100, 48000];

  const t = (key: string) => {
    const translations: { [key: string]: { zh: string, en: string } } = {
      settings: { zh: '设置', en: 'Settings' },
      sampleRate: { zh: '采样率 (Hz)', en: 'Sample Rate (Hz)' },
      save: { zh: '保存', en: 'Save' },
    };
    return translations[key][language];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-700">{t('settings')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition duration-300 ease-in-out"
          >
            <X size={24} />
          </button>
        </div>
        <div>
          <label htmlFor="sampleRate" className="block mb-2 text-sm font-medium text-gray-700">
            {t('sampleRate')}
          </label>
          <select
            id="sampleRate"
            value={sampleRate}
            onChange={(e) => onSampleRateChange(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            {sampleRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-300 ease-in-out"
        >
          {t('save')}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;