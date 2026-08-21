export type FieldKind =
  | 'text'
  | 'textarea'
  | 'image'
  | 'markdown'
  | 'list'
  | 'images'
  | 'toggle'
  /** A list of {value, label} objects, edited as "value | label" lines. */
  | 'pairs';

export interface FieldSpec {
  key: string;
  label: string;
  kind?: FieldKind;
  rows?: number;
  /** Shown under the input — used for SEO guidance and format hints. */
  help?: string;
  /** Soft character budget; the editor shows a counter and warns past it. */
  recommendedMax?: number;
  /** Groups fields into a labelled section inside the expanded row. */
  group?: string;
}

export interface CollectionSpec {
  /** Key on PortfolioData holding the array. */
  key: 'projects' | 'services' | 'blogs' | 'gallery' | 'tools' | 'process' | 'social' | 'stats' | 'disciplines';
  label: string;
  /** Field shown as the row heading in the collapsed list. */
  titleField: string;
  /** Field whose truthiness shows a "hidden" badge in the list. */
  publishedField?: string;
  /** Slug field kept in step with the title field. */
  slugField?: string;
  fields: FieldSpec[];
}

/**
 * Describes each collection so one editor component can render all of them.
 * Field keys are asserted against the seeded data in the tests, which is what
 * keeps a typo here from silently producing an input bound to nothing.
 */
export const COLLECTIONS: CollectionSpec[] = [
  {
    key: 'projects',
    label: 'Projects',
    titleField: 'title',
    slugField: 'slug',
    fields: [
      { key: 'title', label: 'Title', group: 'Basics' },
      { key: 'slug', label: 'URL slug', group: 'Basics', help: 'Appears as /works/your-slug. Leave blank to generate from the title.' },
      { key: 'subtitle', label: 'Subtitle', group: 'Basics', help: 'One line under the title on the case study page.' },
      { key: 'client', label: 'Client', group: 'Basics' },
      { key: 'category', label: 'Category', group: 'Basics', help: 'Used by the filter on the work page.' },
      { key: 'year', label: 'Year', group: 'Basics' },
      { key: 'role', label: 'Your role', group: 'Basics' },
      { key: 'timeline', label: 'Timeline', group: 'Basics', help: 'e.g. "6 weeks".' },
      { key: 'featured', label: 'Featured', kind: 'toggle', group: 'Basics' },
      { key: 'liveUrl', label: 'Live URL', group: 'Basics', help: 'Link to the shipped product, if public.' },

      { key: 'image', label: 'Cover image', kind: 'image', group: 'Media' },
      { key: 'images', label: 'Additional images', kind: 'images', group: 'Media' },

      { key: 'description', label: 'Short description', kind: 'textarea', rows: 3, group: 'Story', recommendedMax: 200 },
      { key: 'challenge', label: 'The challenge', kind: 'textarea', rows: 5, group: 'Story' },
      { key: 'approach', label: 'The approach', kind: 'textarea', rows: 5, group: 'Story' },
      { key: 'outcome', label: 'The outcome', kind: 'textarea', rows: 5, group: 'Story' },
      { key: 'caseStudy', label: 'Full case study', kind: 'markdown', rows: 14, group: 'Story', help: 'Markdown. Used as the long-form body on the case study page.' },

      { key: 'services', label: 'Services delivered', kind: 'list', group: 'Details', help: 'One per line. Rendered as tags.' },
      { key: 'results', label: 'Results', kind: 'pairs', group: 'Details', help: 'One per line as "value | label", e.g. "+180% | organic traffic".' },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'icon', label: 'Icon name', help: 'A lucide icon name, e.g. "Palette".' },
      { key: 'startingAt', label: 'Starting price', help: 'Optional anchor, e.g. "from $2,000".' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
      { key: 'deliverables', label: 'Deliverables', kind: 'list', help: 'One per line. Shown on the services page.' },
    ],
  },
  {
    key: 'blogs',
    label: 'Journal',
    titleField: 'title',
    slugField: 'slug',
    publishedField: 'published',
    fields: [
      { key: 'title', label: 'Title', group: 'Post', recommendedMax: 70 },
      { key: 'slug', label: 'URL slug', group: 'Post', help: 'Appears as /blog/your-slug. Leave blank to generate from the title.' },
      { key: 'published', label: 'Published', kind: 'toggle', group: 'Post', help: 'Drafts stay off the site and out of search, but are viewable by direct link.' },
      { key: 'date', label: 'Date', group: 'Post', help: 'Shown on the post, e.g. "Oct 12, 2024".' },
      { key: 'author', label: 'Author', group: 'Post' },
      { key: 'readTime', label: 'Read time', group: 'Post', help: 'Leave blank to estimate from the word count.' },
      { key: 'tags', label: 'Tags', kind: 'list', group: 'Post', help: 'One per line.' },

      { key: 'image', label: 'Cover image', kind: 'image', group: 'Media' },

      { key: 'excerpt', label: 'Excerpt', kind: 'textarea', rows: 3, group: 'Content', recommendedMax: 160, help: 'Shown in listings, and used as the meta description when none is set.' },
      { key: 'content', label: 'Body', kind: 'markdown', rows: 22, group: 'Content', help: 'Markdown. Use ## for section headings — they become the outline search engines read.' },

      { key: 'seoTitle', label: 'SEO title', group: 'Search', recommendedMax: 60, help: 'Overrides the browser tab and search result title. Falls back to the post title.' },
      { key: 'metaDescription', label: 'Meta description', kind: 'textarea', rows: 3, group: 'Search', recommendedMax: 160, help: 'The grey text under your link in search results. Falls back to the excerpt.' },
      { key: 'ogImage', label: 'Social share image', kind: 'image', group: 'Search', help: 'Shown when the link is shared. Falls back to the cover image.' },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    titleField: 'caption',
    fields: [
      { key: 'caption', label: 'Caption' },
      // Free text rather than a constrained input: spanFor() in LandingPage has
      // a default branch, so an unrecognised value renders the square tile
      // instead of breaking the mosaic.
      { key: 'size', label: 'Size', help: 'sm, md or lg — controls how much space the tile takes.' },
      { key: 'image', label: 'Image', kind: 'image' },
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label', help: 'e.g. "Projects".' },
      { key: 'value', label: 'Value', help: 'Numbers count up when the page loads. Non-numeric values render as written.' },
      { key: 'suffix', label: 'Suffix', help: 'e.g. "+" or "y".' },
    ],
  },
  {
    key: 'disciplines',
    label: 'Disciplines',
    titleField: 'key',
    fields: [
      { key: 'key', label: 'Name', help: 'The column heading, e.g. "Design".' },
      { key: 'blurb', label: 'Blurb', kind: 'textarea', rows: 2 },
      { key: 'items', label: 'Items', kind: 'list', help: 'One per line.' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'iconName', label: 'Icon name', help: 'A lucide icon name.' },
    ],
  },
  {
    key: 'process',
    label: 'Process',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'iconName', label: 'Icon name', help: 'A lucide icon name, e.g. "Target".' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'social',
    label: 'Social links',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL', help: 'Leave empty to show the label without a link.' },
    ],
  },
];

/** A blank item with every field of a spec present and correctly typed. */
export const emptyItem = (spec: CollectionSpec): Record<string, unknown> => {
  const item: Record<string, unknown> = { id: crypto.randomUUID() };
  for (const field of spec.fields) {
    if (field.kind === 'list' || field.kind === 'images' || field.kind === 'pairs') item[field.key] = [];
    else if (field.kind === 'toggle') item[field.key] = field.key === 'published';
    else item[field.key] = '';
  }
  return item;
};

export type CollectionKey = CollectionSpec['key'];

/** Fields grouped in declaration order, so the editor can render sections. */
export const groupedFields = (spec: CollectionSpec): Array<[string, FieldSpec[]]> => {
  const groups = new Map<string, FieldSpec[]>();
  for (const field of spec.fields) {
    const name = field.group ?? '';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name)!.push(field);
  }
  return [...groups.entries()];
};
