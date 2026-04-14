import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
// Icons as simple emoji strings for now
const Icons = {
  BuildingStorefront: '🏢',
  Phone: '📞', 
  Envelope: '✉️',
  MapPin: '📍',
  Clock: '🕐',
  Cog: '⚙️',
  Check: '✓',
  XMark: '✗'
};

interface SettingsForm {
  siteName: string;
  companyName: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  whatsappPhone: string;
  address: string;
  workingHours: string;
}

const SETTINGS_CONFIG = [
  {
    key: 'siteName',
    label: 'שם האתר',
    icon: Icons.BuildingStorefront,
    placeholder: 'לדוגמה: DoWe — ניהול חתונה ואישורי הגעה',
    type: 'text'
  },
  {
    key: 'companyName',
    label: 'שם החברה',
    icon: Icons.BuildingStorefront,
    placeholder: 'לדוגמה: DoWe',
    type: 'text'
  },
  {
    key: 'email',
    label: 'כתובת מייל',
    icon: Icons.Envelope,
    placeholder: 'לדוגמה: info@dowe.co.il',
    type: 'email'
  },
  {
    key: 'primaryPhone',
    label: 'טלפון ראשי',
    icon: Icons.Phone,
    placeholder: 'לדוגמה: 052-402-5710',
    type: 'tel'
  },
  {
    key: 'secondaryPhone',
    label: 'טלפון משני',
    icon: Icons.Phone,
    placeholder: 'לדוגמה: 054-487-1731',
    type: 'tel'
  },
  {
    key: 'whatsappPhone',
    label: 'טלפון וואטסאפ',
    icon: Icons.Phone,
    placeholder: 'לדוגמה: 972524025710',
    type: 'tel'
  },
  {
    key: 'address',
    label: 'כתובת',
    icon: Icons.MapPin,
    placeholder: 'לדוגמה: יפו-תל אביב',
    type: 'text'
  },
  {
    key: 'workingHours',
    label: 'שעות עבודה',
    icon: Icons.Clock,
    placeholder: 'לדוגמה: א\'-ה\' 08:00-19:00',
    type: 'text'
  }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsForm>({
    siteName: '',
    companyName: '',
    email: '',
    primaryPhone: '',
    secondaryPhone: '',
    whatsappPhone: '',
    address: '',
    workingHours: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SettingsForm>({} as SettingsForm);

  // טעינת הגדרות מהשרת
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/group/site');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        console.log('📋 Loaded settings data:', settingsData);
        
        const formData: SettingsForm = {
          siteName: (typeof settingsData.siteName?.value === 'string') 
            ? settingsData.siteName.value 
            : settingsData.siteName?.value?.value || '',
          companyName: (typeof settingsData.companyName?.value === 'string') 
            ? settingsData.companyName.value 
            : settingsData.companyName?.value?.value || '',
          email: (typeof settingsData.email?.value === 'string') 
            ? settingsData.email.value 
            : settingsData.email?.value?.value || '',
          primaryPhone: (typeof settingsData.primaryPhone?.value === 'string') 
            ? settingsData.primaryPhone.value 
            : settingsData.primaryPhone?.value?.value || '',
          secondaryPhone: (typeof settingsData.secondaryPhone?.value === 'string') 
            ? settingsData.secondaryPhone.value 
            : settingsData.secondaryPhone?.value?.value || '',
          whatsappPhone: (typeof settingsData.whatsappPhone?.value === 'string') 
            ? settingsData.whatsappPhone.value 
            : settingsData.whatsappPhone?.value?.value || '',
          address: (typeof settingsData.address?.value === 'string') 
            ? settingsData.address.value 
            : settingsData.address?.value?.value || '',
          workingHours: (typeof settingsData.workingHours?.value === 'string') 
            ? settingsData.workingHours.value 
            : settingsData.workingHours?.value?.value || ''
        };
        
        console.log('📝 Processed form data:', formData);
        setSettings(formData);
        setOriginalSettings(formData);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('שגיאה בטעינת ההגדרות: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // שמירת הגדרות
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // הכנת המידע לשליחה
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value: { value },
        groupName: 'site'
      }));

      const response = await api.put('/settings/bulk', {
        settings: settingsToSave
      });

      if (response.data.success) {
        toast.success('ההגדרות נשמרו בהצלחה!');
        setOriginalSettings(settings);
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('שגיאה בשמירת ההגדרות: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // איפוס שינויים
  const resetSettings = () => {
    setSettings(originalSettings);
    toast.success('השינויים בוטלו');
  };

  // בדיקה האם יש שינויים
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // עדכון שדה
  const updateField = (key: keyof SettingsForm, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{Icons.Cog}</span>
          <h1 className="text-3xl font-bold text-gray-900">הגדרות האתר</h1>
        </div>
        <p className="text-gray-600">
          נהל את ההגדרות הבסיסיות של האתר שלך. השינויים יחולו מיידית על האתר הציבורי.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {SETTINGS_CONFIG.map((config) => {
            return (
              <div key={config.key} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-3">
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.label}
                  </label>
                  <input
                    type={config.type}
                    value={settings[config.key as keyof SettingsForm]}
                    onChange={(e) => updateField(config.key as keyof SettingsForm, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    dir="auto"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-amber-600 font-medium">
                יש לך שינויים שלא נשמרו
              </div>
              <div className="flex gap-3">
                <button
                  onClick={resetSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <span>{Icons.XMark}</span>
                  ביטול
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{Icons.Check}</span>
                  )}
                  {saving ? 'שומר...' : 'שמירה'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-blue-500 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">טיפים שימושיים:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• טלפון וואטסאפ צריך להיות במפורט בינלאומי (972524025710)</li>
              <li>• שעות העבודה יוצגו באתר הציבורי</li>
              <li>• כל השינויים נכנסים לתוקף מיידית</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}