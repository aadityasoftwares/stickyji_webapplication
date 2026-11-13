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
      logo: `${SITE_URL}/StickyJiLogo.png`,
      sameAs: [
        'https://x.com/stickyji',
        'https://www.facebook.com/stickyji',
        'https://www.instagram.com/stickyjiapp/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'Sticky Ji',
      alternateName: ['StickyJi', 'Sticky Ji App', 'Digital Sticky Notes'],
      url: `${SITE_URL}/`,
      description: PUBLIC_PAGES[''].description,
      publisher: { '@id': `${SITE_URL}/#publisher` },
    },
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'Sticky Ji',
      alternateName: ['Sticky Ji Digital Sticky Notes', 'StickyJi Online Notes'],
      url: `${SITE_URL}/`,
      applicationCategory: 'ProductivityApplication',
      applicationSubCategory: 'Digital Sticky Notes & Task Planning',
      operatingSystem: 'Web browser',
      browserRequirements: 'Requires JavaScript and an internet connection',
      description: PUBLIC_PAGES[''].description,
      image: `${SITE_URL}/StickyJiLogo.png`,
      publisher: { '@id': `${SITE_URL}/#publisher` },
      featureList: [
        'Digital sticky notes',
        'Online color-coded sticky notes',
        'Interactive task checklists',
        'Kanban columns and boards',
        'Workspaces and folders',
        'Today view daily task planner',
        'Cross-browser desktop and mobile accessibility',
      ],
    },
  ],
};
