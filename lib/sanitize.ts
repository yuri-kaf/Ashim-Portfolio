import { INITIAL_DATA } from '../constants.js';
import { PortfolioData, SocialLink } from '../types.js';

/** Keeps only entries that are plain objects — guards against nulls in arrays. */
const objectsOnly = <T>(value: unknown, fallback: T[]): T[] =>
  Array.isArray(value)
    ? (value.filter((item) => item && typeof item === 'object' && !Array.isArray(item)) as T[])
    : fallback;

const stringOr = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/** A social entry is unusable without an id and a label; url may be empty. */
const sanitizeSocial = (value: unknown): SocialLink[] => {
  if (!Array.isArray(value)) return INITIAL_DATA.social;
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .filter((item) => typeof item.id === 'string' && typeof item.label === 'string')
    .map((item) => ({
      id: item.id as string,
      label: item.label as string,
      url: stringOr(item.url, ''),
    }));
};

/**
 * Normalises an unknown value into a complete `PortfolioData`.
 *
 * Runs on both sides: the client uses it on whatever the API returns, and the
 * `PUT /api/content` handler uses it before writing. Sharing one implementation
 * is what stops the stored document from drifting out of shape with `types.ts`.
 *
 * Idempotent by construction — sanitizing an already-sanitized value is a no-op.
 */
export const sanitizePortfolioData = (input: unknown): PortfolioData => {
  const base = INITIAL_DATA;

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return base;
  }

  const dirty = input as Record<string, any>;
  const dirtyCompany = dirty.company && typeof dirty.company === 'object' ? dirty.company : {};
  const dirtyVibe = dirty.vibe && typeof dirty.vibe === 'object' ? dirty.vibe : {};

  return {
    name: stringOr(dirty.name, base.name),
    role: stringOr(dirty.role, base.role),
    tagline: stringOr(dirty.tagline, base.tagline),
    company: {
      name: stringOr(dirtyCompany.name, base.company.name),
      role: stringOr(dirtyCompany.role, base.company.role),
      description: stringOr(dirtyCompany.description, base.company.description),
      url: stringOr(dirtyCompany.url, base.company.url ?? ''),
    },
    availability: ['available', 'busy', 'vacation'].includes(dirty.availability)
      ? dirty.availability
      : base.availability,
    projects: objectsOnly(dirty.projects, base.projects),
    services: objectsOnly(dirty.services, base.services),
    blogs: objectsOnly(dirty.blogs, base.blogs),
    process: objectsOnly(dirty.process, base.process),
    tools: objectsOnly(dirty.tools, base.tools),
    gallery: objectsOnly(dirty.gallery, base.gallery),
    social: sanitizeSocial(dirty.social),
    vibe: {
      title: stringOr(dirtyVibe.title, base.vibe.title),
      description: stringOr(dirtyVibe.description, base.vibe.description),
      philosophy: Array.isArray(dirtyVibe.philosophy)
        ? dirtyVibe.philosophy.filter((entry: unknown) => typeof entry === 'string')
        : base.vibe.philosophy,
    },
  };
};
