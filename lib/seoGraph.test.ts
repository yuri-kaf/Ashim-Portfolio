import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { LIMI_ORG_ID, PERSON_ID, buildGraph } from './seoGraph';

type Node = Record<string, any>;
type Graph = { '@context': string; '@graph': Node[] };

const seo = INITIAL_DATA.seo;
const base = { seo, data: INITIAL_DATA };
const typesOf = (graph: Graph) => graph['@graph'].map((node) => node['@type']);
const nodeOf = (graph: Graph, type: string) => graph['@graph'].find((node) => node['@type'] === type)!;

describe('buildGraph', () => {
  it('always includes the person and the agency', () => {
    const graph = buildGraph({ ...base, path: '/', title: 'Home' });
    expect(typesOf(graph)).toContain('Person');
    expect(typesOf(graph)).toContain('Organization');
  });

  it('names Ashim as the founder of Limi Creatives, both ways', () => {
    const graph = buildGraph({ ...base, path: '/about', title: 'About' });
    expect(nodeOf(graph, 'Person').worksFor).toEqual({ '@id': LIMI_ORG_ID });
    expect(nodeOf(graph, 'Organization').founder).toEqual({ '@id': PERSON_ID });
  });

  it('gives the agency node a url, not just an @id', () => {
    // The seed and the live content document both carried url: '', which
    // shipped a founder relationship pointing at an Organization with no
    // address on the web.
    const graph = buildGraph({ ...base, path: '/about', title: 'About' });
    expect(nodeOf(graph, 'Organization').url).toBe('https://limicreatives.com');
  });

  it('references the exact @id limicreatives.com already publishes', () => {
    // Verified live 2026-09-12. A trailing slash or a www prefix here would
    // silently create a second, unrelated entity instead of merging.
    expect(LIMI_ORG_ID).toBe('https://limicreatives.com/#organization');
    expect(PERSON_ID).toBe('https://www.ashimkafle.com.np/#person');
  });

  it('declares no second local business at Limi’s phone number', () => {
    const graph = buildGraph({ ...base, path: '/contact', title: 'Contact' });
    expect(typesOf(graph)).not.toContain('LocalBusiness');
    expect(typesOf(graph)).not.toContain('ProfessionalService');
  });

  it('adds breadcrumbs for nested pages but not the home page', () => {
    expect(typesOf(buildGraph({ ...base, path: '/services/web-design', title: 'Web Design' })))
      .toContain('BreadcrumbList');
    expect(typesOf(buildGraph({ ...base, path: '/', title: 'Home' })))
      .not.toContain('BreadcrumbList');
  });

  it('emits FAQPage only when there are faqs', () => {
    const withFaqs = buildGraph({
      ...base, path: '/services/branding', title: 'Branding',
      faqs: [{ id: 'f1', question: 'How long?', answer: 'Four weeks.' }],
    });
    expect(nodeOf(withFaqs, 'FAQPage').mainEntity[0].acceptedAnswer.text).toBe('Four weeks.');
    expect(typesOf(buildGraph({ ...base, path: '/services/branding', title: 'Branding' })))
      .not.toContain('FAQPage');
  });

  it('never names the agency as the publisher of this domain', () => {
    // This is the person's site. Publishing credit belongs to the person; the
    // founder relationship is carried by worksFor/founder and nothing else.
    const graph = buildGraph({
      ...base, path: '/blog/x', title: 'X',
      article: { headline: 'X', published: '2026-01-01' },
    });
    const post = nodeOf(graph, 'BlogPosting');
    expect(post.author).toEqual({ '@id': PERSON_ID });
    expect(post.publisher).toEqual({ '@id': PERSON_ID });
    expect(post.publisher).not.toEqual({ '@id': LIMI_ORG_ID });
  });

  it('emits a case study as a CreativeWork, credited with creator', () => {
    // A portfolio piece is not a blog post: BlogPosting asserts membership in
    // a Blog this domain does not have.
    const graph = buildGraph({
      ...base, path: '/works/vortex-crypto', title: 'Vortex Crypto',
      article: { headline: 'Vortex Crypto', type: 'CreativeWork', published: '2024-01-01' },
    });
    expect(typesOf(graph)).toContain('CreativeWork');
    expect(typesOf(graph)).not.toContain('BlogPosting');
    const work = nodeOf(graph, 'CreativeWork');
    expect(work.creator).toEqual({ '@id': PERSON_ID });
    expect(work.author).toBeUndefined();
    expect(work.publisher).toBeUndefined();
    expect(work.datePublished).toBe('2024-01-01');
  });

  it('omits datePublished rather than inventing one', () => {
    const graph = buildGraph({
      ...base, path: '/works/x', title: 'X',
      article: { headline: 'X', type: 'CreativeWork' },
    });
    expect(nodeOf(graph, 'CreativeWork')).not.toHaveProperty('datePublished');
  });

  it('breadcrumbs the visible label, not the SEO title', () => {
    // The page is titled "Web Design & UI/UX in Nepal"; the trail on the page
    // reads "Web Design & UI/UX". Google expects the markup to match the trail.
    const graph = buildGraph({
      ...base,
      path: '/services/web-design',
      title: 'Web Design & UI/UX in Nepal',
      breadcrumbTitle: 'Web Design & UI/UX',
    });
    const crumbs = nodeOf(graph, 'BreadcrumbList').itemListElement;
    expect(crumbs.map((crumb: Node) => crumb.name))
      .toEqual(['Home', 'Services', 'Web Design & UI/UX']);
  });

  it('falls back to the title when no breadcrumb label is given', () => {
    const graph = buildGraph({ ...base, path: '/services/branding', title: 'Branding' });
    const crumbs = nodeOf(graph, 'BreadcrumbList').itemListElement;
    expect(crumbs[crumbs.length - 1].name).toBe('Branding');
  });

  it('never names one page two different ways in the same graph', () => {
    // A trailing slash used to reach the self-URL raw while the breadcrumb
    // was canonicalised, so one graph disagreed with itself.
    const graph = buildGraph({
      ...base, path: '/services/branding/', title: 'Branding',
      service: { name: 'Branding', description: 'x' },
    });
    const crumbs = nodeOf(graph, 'BreadcrumbList').itemListElement;
    expect(nodeOf(graph, 'Service').url).toBe(crumbs[crumbs.length - 1].item);
    expect(nodeOf(graph, 'Service').url)
      .toBe('https://www.ashimkafle.com.np/services/branding');
  });

  it('resolves image paths against the site origin', () => {
    const graph = buildGraph({ ...base, path: '/', title: 'Home' });
    expect(nodeOf(graph, 'Person').image).toBe('https://www.ashimkafle.com.np/ashim-portrait.png');
  });
});
