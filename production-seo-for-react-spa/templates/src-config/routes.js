// Plain-data route manifest — single source of truth for App.jsx (routing),
// Navbar.jsx (nav links), scripts/prerender.js (which routes to prerender),
// and sitemap.xml (generated from this list at build time). Keep this file
// free of JSX/component imports so plain Node can import it directly.
export const ROUTES = [
  {
    path: '/',
    navLabel: 'Home',
    navEnd: true,
    title: 'Your Product — One-line value prop | Brand',
    description: 'Search-snippet description, ~150-160 chars, unique per page.',
    changefreq: 'daily',
    priority: '1.0'
  },
  {
    path: '/docs',
    navLabel: 'Docs',
    title: 'Docs | Brand',
    description: 'Another unique description for this page.',
    changefreq: 'weekly',
    priority: '0.8'
  }
];
