import React, { useState } from 'react';
import { X, Check, Image as ImageIcon, HardDrive } from 'lucide-react';
import { openGooglePicker, PickedDriveFile } from '../firebase/googlePicker';

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  type?: 'food' | 'cover' | 'logo';
}

const FOOD_PRESETS = [
  { name: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Gourmet Pizza', url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281878?auto=format&fit=crop&w=600&q=80' },
  { name: 'Bruschetta Starter', url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fresh Salad Bowl', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sushi Platter', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Grilled Steak', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { name: 'Dessert Tiramisu', url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' },
  { name: 'Iced Coffee Latte', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Cocktail / Drink', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tacos & Guacamole', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80' },
  { name: 'Ramen Bowl', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
];

const COVER_PRESETS = [
  { name: 'Cozy Restaurant Interior', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Modern Bistro Bar', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Warm Bakery Counter', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Outdoor Terrace', url: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80' },
];

const LOGO_PRESETS = [
  { name: 'Italian Bistro Badge', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=300&q=80' },
  { name: 'Café Coffee Bean', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80' },
  { name: 'Pizzeria Icon', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80' },
];

export const ImagePicker: React.FC<ImagePickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Image',
  type = 'food',
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [selectedUrl, setSelectedUrl] = useState('');
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = type === 'cover' ? COVER_PRESETS : type === 'logo' ? LOGO_PRESETS : FOOD_PRESETS;

  const handleApply = () => {
    const finalUrl = customUrl.trim() || selectedUrl;
    if (finalUrl) {
      onSelect(finalUrl);
      onClose();
    }
  };

  const handleOpenGooglePicker = async () => {
    setIsDriveLoading(true);
    setDriveError(null);
    try {
      await openGooglePicker(
        (file: PickedDriveFile) => {
          setIsDriveLoading(false);
          onSelect(file.url);
          onClose();
        },
        (errMessage) => {
          setIsDriveLoading(false);
          setDriveError(errMessage);
        }
      );
    } catch (e: any) {
      setIsDriveLoading(false);
      setDriveError(e.message || 'Error opening Google Drive picker.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Google Drive Option */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Google Drive Picker</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Browse and pick images directly from your Google Drive files.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenGooglePicker}
                disabled={isDriveLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#0066DA" d="m6 6 14 26 23-32z"/>
                  <path fill="#00AC47" d="m43 0 23 32h-46z"/>
                  <path fill="#EA4335" d="m66 32 21 32h-46z"/>
                  <path fill="#00832D" d="m20 32 14 26h46z"/>
                  <path fill="#2684FC" d="m34 58-14 20h46z"/>
                  <path fill="#FFBA00" d="m20 32 23 46h-23z"/>
                </svg>
                <span>{isDriveLoading ? 'Opening Picker...' : 'Select from Google Drive'}</span>
              </button>
            </div>

            {driveError && (
              <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                {driveError}
              </p>
            )}
          </div>

          {/* Custom URL Option */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Or Paste Direct Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  if (e.target.value) setSelectedUrl('');
                }}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Or Choose Preset Image
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedUrl === preset.url || customUrl === preset.url;
                return (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => {
                      setSelectedUrl(preset.url);
                      setCustomUrl(preset.url);
                    }}
                    className={`group relative rounded-xl overflow-hidden border-2 text-left transition duration-150 aspect-[4/3] bg-slate-100 dark:bg-slate-800 ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-2.5 flex flex-col justify-end">
                      <span className="text-xs font-medium text-white drop-shadow-sm line-clamp-1">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!customUrl && !selectedUrl}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white shadow-sm disabled:opacity-50 transition"
          >
            Use Image
          </button>
        </div>
      </div>
    </div>
  );
};

