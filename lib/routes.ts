/**
 * The one place the site's URL structure is declared.
 *
 * Both the router (App.tsx) and the build-time prerenderer read this, so a
 * route can never exist in the SPA but be missing from the sitemap — which is
 * exactly how pages end up unindexed.
 */
export interface StaticRoute {
  path: string;
  /** Breadcrumb and nav label. */
  label: string;
  /** Sitemap priority. Personality pages sit below the money pages. */
  priority: string;
}

export const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', label: 'Home', priority: '1.0' },
  // /about carries the Person entity and the founder claim. It is the page
  // this whole restructure exists to get ranked.
  { path: '/about', label: 'About', priority: '0.9' },
  { path: '/contact', label: 'Contact', priority: '0.9' },
  { path: '/services', label: 'Services', priority: '0.9' },
  { path: '/works', label: 'Work', priority: '0.8' },
  { path: '/blog', label: 'Journal', priority: '0.7' },
  { path: '/gallery', label: 'Gallery', priority: '0.4' },
  { path: '/vibe', label: 'Vibe', priority: '0.4' },
];

export const routeByPath = (path: string): StaticRoute | undefined =>
  STATIC_ROUTES.find((route) => route.path === path);

/**
 * Maps a nested path to the hub it hangs off. Order matters: the category
 * prefix must be tested before the bare blog prefix, or every category page
 * would breadcrumb as if it were a post.
 *
 * Carries no display name of its own — the label is read back out of
 * STATIC_ROUTES, so renaming a route cannot leave its breadcrumb behind.
 */
const PARENTS: Array<{ prefix: string; path: string }> = [
  { prefix: '/services/', path: '/services' },
  { prefix: '/works/', path: '/works' },
  { prefix: '/blog/category/', path: '/blog' },
  { prefix: '/blog/', path: '/blog' },
];

/**
 * One page, one spelling. A stray trailing slash would otherwise make a hub
 * the parent of itself in the breadcrumb trail, and would put two different
 * URLs for the same page into one JSON-LD graph. Both matter: the prerender
 * script builds these paths by hand, where a typo is easy.
 */
export const canonicalPath = (path: string): string =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

export interface Crumb {
  name: string;
  path: string;
}

const crumbFor = (path: string): Crumb => ({
  name: routeByPath(path)?.label ?? path,
  path,
});

/**
 * Home → hub → current page. Never more than three levels, because the site
 * is never deeper than three levels.
 */
export const breadcrumbTrail = (path: string, title: string): Crumb[] => {
  const canonical = canonicalPath(path);
  if (canonical === '/') return [crumbFor('/')];

  const trail: Crumb[] = [crumbFor('/')];
  const parent = PARENTS.find((candidate) => canonical.startsWith(candidate.prefix));
  if (parent) trail.push(crumbFor(parent.path));
  trail.push({ name: title, path: canonical });
  return trail;
};
