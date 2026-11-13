import pages from './public-pages.json';

export const SITE_URL = 'https://stickyji.com';
export const PUBLIC_PAGES: Readonly<Record<string, { title: string; description: string }>> = pages;
export const PUBLIC_PATHS = Object.keys(PUBLIC_PAGES);

export interface SeoConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>> | null;
}

export const HOME_SCHEMA: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#publisher`,
      name: 'Aaditya Softwares',
      url: `${SITE_URL}/about-us`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Sticky Ji',
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'Sticky Ji',
      url: `${SITE_URL}/`,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Web browser',
      browserRequirements: 'Requires JavaScript and an internet connection',
      description: PUBLIC_PAGES[''].description,
      image: `${SITE_URL}/StickyJiLogo.png`,
      publisher: { '@id': `${SITE_URL}/#publisher` },
      featureList: [
        'Digital sticky notes',
        'Checklists',
        'Workspaces and folders',
        'Kanban columns',
        'Today view',
      ],
    },
  ],
};
