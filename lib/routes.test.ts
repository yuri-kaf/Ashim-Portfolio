import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, breadcrumbTrail, routeByPath } from './routes';

describe('routes', () => {
  it('exposes every indexable static route', () => {
    expect(STATIC_ROUTES.map((route) => route.path)).toEqual([
      '/', '/about', '/contact', '/services', '/works', '/blog', '/gallery', '/vibe',
    ]);
  });

  it('ranks about second only to the home page, because it is the entity page', () => {
    expect(routeByPath('/')?.priority).toBe('1.0');
    expect(routeByPath('/about')?.priority).toBe('0.9');
  });

  it('drops the personality pages down the sitemap', () => {
    expect(routeByPath('/vibe')?.priority).toBe('0.4');
    expect(routeByPath('/gallery')?.priority).toBe('0.4');
  });

  it('builds a trail from home to the current page', () => {
    expect(breadcrumbTrail('/services/web-design', 'Web Design')).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Services', path: '/services' },
      { name: 'Web Design', path: '/services/web-design' },
    ]);
  });

  it('breadcrumbs a category page under the journal, not as a post', () => {
    expect(breadcrumbTrail('/blog/category/design', 'Design')).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/blog' },
      { name: 'Design', path: '/blog/category/design' },
    ]);
  });

  it('returns just home for the home page', () => {
    expect(breadcrumbTrail('/', 'Home')).toEqual([{ name: 'Home', path: '/' }]);
  });
});
