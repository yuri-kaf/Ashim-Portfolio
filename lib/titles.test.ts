import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { TITLE_LIMIT, aboutTitle, composeTitle, contactTitle, homeTitle, hubTitles } from './titles';

const seo = INITIAL_DATA.seo;

describe('titles', () => {
  it('never ships a bare site name as the home title', () => {
    expect(homeTitle(INITIAL_DATA)).toBe('Ashim Kafle — Product Designer & Digital Marketer in Nepal');
    expect(homeTitle(INITIAL_DATA)).not.toBe(seo.siteName);
  });

  it('puts the country in the home title only when it fits', () => {
    const long = { ...INITIAL_DATA, role: 'Senior Product Designer & Performance Marketer' };
    expect(homeTitle(long)).toBe('Ashim Kafle — Senior Product Designer & Performance Marketer');
    const nowhere = { ...INITIAL_DATA, seo: { ...INITIAL_DATA.seo, geo: { ...INITIAL_DATA.seo.geo, country: '' } } };
    expect(homeTitle(nowhere)).toBe('Ashim Kafle — Product Designer & Digital Marketer');
  });

  it('names the hubs for what people search, not for the nav label', () => {
    const hubs = hubTitles(INITIAL_DATA);
    expect(hubs.services.exactTitle).toBe('Web Design, UI/UX & Branding Services in Nepal');
    expect(composeTitle(seo, hubs.blog.title)).toBe('Web Design & Digital Marketing Blog | Ashim Kafle');
    for (const hub of Object.values(hubs)) {
      expect(composeTitle(seo, hub.title, hub.exactTitle).length).toBeLessThanOrEqual(TITLE_LIMIT);
    }
  });

  it('names the founder role on /about instead of the name twice', () => {
    const title = aboutTitle(INITIAL_DATA);
    expect(title).toBe('Ashim Kafle — Co-founder & CMO of Limi Creatives');
    // "About Ashim Kafle | Ashim Kafle" was the regression.
    expect(title.match(/Ashim Kafle/g)).toHaveLength(1);
  });

  it('keeps every exact title inside the SERP budget', () => {
    expect(homeTitle(INITIAL_DATA).length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(aboutTitle(INITIAL_DATA).length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(contactTitle(INITIAL_DATA).length).toBeLessThanOrEqual(TITLE_LIMIT);
  });

  it('puts local intent in the /contact title instead of the name twice', () => {
    const title = contactTitle(INITIAL_DATA);
    expect(title).toBe('Contact — Web Designer in Kathmandu');
    // "Contact Ashim Kafle | Ashim Kafle" was the regression.
    expect(title).not.toMatch(/Ashim Kafle/);
    // It must not promise a city the page's own h1 does not name.
    expect(title).toContain(INITIAL_DATA.seo.geo.city);
  });

  it('does not assert a city the data does not carry', () => {
    const data = {
      ...INITIAL_DATA,
      seo: { ...INITIAL_DATA.seo, geo: { ...INITIAL_DATA.seo.geo, city: '' } },
      contact: { ...INITIAL_DATA.contact, location: '  ' },
    };
    expect(contactTitle(data)).toBe('Contact');
  });

  it('emits an exact title verbatim and suffixes everything else', () => {
    expect(composeTitle(seo, 'Services')).toBe('Services | Ashim Kafle');
    expect(composeTitle(seo, 'Services', homeTitle(INITIAL_DATA)))
      .toBe('Ashim Kafle — Product Designer & Digital Marketer in Nepal');
    expect(composeTitle(seo, '', '  ')).toBe(seo.siteName);
  });

  it('drops the suffix rather than push a long title past the SERP budget', () => {
    const long = 'UI/UX Design Cost in Nepal: Pricing, When You Need It & Why It Matters';
    expect(composeTitle(seo, long)).toBe(long);
    expect(composeTitle(seo, 'UI/UX Design Cost in Nepal')).toBe('UI/UX Design Cost in Nepal | Ashim Kafle');
  });

  it('falls back rather than inventing a role the data does not carry', () => {
    const data = { ...INITIAL_DATA, company: { ...INITIAL_DATA.company, role: '' } };
    expect(aboutTitle(data)).toBe(homeTitle(data));
  });
});
