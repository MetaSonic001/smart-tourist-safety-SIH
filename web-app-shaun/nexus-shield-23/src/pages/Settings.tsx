import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';

export const Settings = () => {
  const { useMockMode, setUseMockMode } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [largeFont, setLargeFont] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);

  React.useEffect(() => {
    document.body.style.fontSize = largeFont ? '1.25rem' : '';
    document.body.classList.toggle('high-contrast', highContrast);
  }, [largeFont, highContrast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings') || 'Settings'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="flex items-center gap-3">
              <Switch checked={useMockMode} onCheckedChange={setUseMockMode} />
              <span>{t('mockMode') || 'Mock Mode'} {useMockMode && <span className="text-warning">({t('demoModeActive') || 'Demo Mode Active'})</span>}</span>
            </label>
            <p className="text-xs text-muted-foreground">{t('mockModeDesc') || 'When enabled, all data is loaded from local mock files.'}</p>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <Switch checked={largeFont} onCheckedChange={setLargeFont} />
              <span>{t('largeFont') || 'Large Font'}</span>
            </label>
            <label className="flex items-center gap-3 mt-2">
              <Switch checked={highContrast} onCheckedChange={setHighContrast} />
              <span>{t('highContrast') || 'High Contrast'}</span>
            </label>
            <p className="text-xs text-muted-foreground">{t('accessibilityDesc') || 'Accessibility options for improved readability.'}</p>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <span>{t('language') || 'Language'}:</span>
              <select value={language} onChange={e => setLanguage(e.target.value as any)} className="border rounded px-2 py-1">
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </label>
          </div>

          <div>
            <RoleSwitcher />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
