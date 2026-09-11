import { describe, expect, it } from 'vitest';
import { INITIAL_DATA } from '../constants';
import { TITLE_LIMIT, aboutTitle, composeTitle, homeTitle } from './titles';

const seo = INITIAL_DATA.seo;

describe('titles', () => {
  it('never ships a bare site name as the home title', () => {
    expect(homeTitle(INITIAL_DATA)).toBe('Ashim Kafle — Product Designer & Digital Marketer');
    expect(homeTitle(INITIAL_DATA)).not.toBe(seo.siteName);
  });

  it('names the founder role on /about instead of the name twice', () => {
    const title = aboutTitle(INITIAL_DATA);
    expect(title).toBe('Ashim Kafle — Co-founder & CMO of Limi Creatives');
    // "About Ashim Kafle | Ashim Kafle" was the regression.
    expect(title.match(/Ashim Kafle/g)).toHaveLength(1);
  });

  it('keeps both exact titles inside the SERP budget', () => {
    expect(homeTitle(INITIAL_DATA).length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(aboutTitle(INITIAL_DATA).length).toBeLessThanOrEqual(TITLE_LIMIT);
  });

  it('emits an exact title verbatim and suffixes everything else', () => {
    expect(composeTitle(seo, 'Services')).toBe('Services | Ashim Kafle');
    expect(composeTitle(seo, 'Services', homeTitle(INITIAL_DATA)))
      .toBe('Ashim Kafle — Product Designer & Digital Marketer');
    expect(composeTitle(seo, '', '  ')).toBe(seo.siteName);
  });

  it('falls back rather than inventing a role the data does not carry', () => {
    const data = { ...INITIAL_DATA, company: { ...INITIAL_DATA.company, role: '' } };
    expect(aboutTitle(data)).toBe(homeTitle(data));
  });
});
