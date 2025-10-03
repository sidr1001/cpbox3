import { useEffect } from 'react';
import { useSiteSettings } from './useSiteSettings';

export function useDocumentTitle(pageTitle?: string) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    // Update document title
    const title = pageTitle ? `${pageTitle} - ${settings.site_name}` : settings.site_title;
    document.title = title;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', settings.site_description);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', settings.seo_keywords);
    }

    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', settings.site_description);
    }
  }, [settings, pageTitle]);
}