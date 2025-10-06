import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface SiteSettings {
  site_name: string;
  site_title: string;
  site_description: string;
  seo_keywords: string;
  admin_url: string;
  payment_methods: string[];
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: 'CrossPost Pro',
    site_title: 'CrossPost Pro - Кроссплатформенный публикатор контента',
    site_description: 'Современное приложение для публикации контента в VK и Telegram',
    seo_keywords: 'SMM, социальные сети, VK, Telegram, публикация контента',
    admin_url: '/admin',
    payment_methods: ['card', 'bank_transfer']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient.getSettings();
        if (data) {
          setSettings({
            site_name: data.site_name || settings.site_name,
            site_title: data.site_title || settings.site_title,
            site_description: data.site_description || settings.site_description,
            seo_keywords: data.seo_keywords || settings.seo_keywords,
            admin_url: data.admin_url || settings.admin_url,
            payment_methods: Array.isArray(data.payment_methods)
              ? data.payment_methods.filter((method: any): method is string => typeof method === 'string')
              : settings.payment_methods,
          });
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    // No realtime in REST setup
    return () => {};
  }, []);

  return { settings, loading };
}