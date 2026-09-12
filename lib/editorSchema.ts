import { PortfolioData } from '../types';

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'image'
  | 'markdown'
  | 'list'
  | 'images'
  | 'toggle'
  /** A dropdown constrained to `options`. Free text where only a fixed set of
   *  values is meaningful is a typo waiting to change behaviour. */
  | 'select'
  /** A list of two-string objects, edited as "first | second" lines. */
  | 'pairs';

/** One choice in a `select`: a stored value and the label shown for it. */
export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  kind?: FieldKind;
  /** For `select`: the only values the field may take. */
  options?: string[];
  /**
   * For `select`: take the choices from another collection the user edits
   * rather than from a fixed list. The stored value is that item's `id`; the
   * label shown is its collection's `titleField`. Resolved by `selectOptions`.
   */
  optionsFrom?: CollectionKey;
  /** Label for the blank choice an `optionsFrom` select always offers. */
  emptyLabel?: string;
  rows?: number;
  /**
   * For `pairs`: the two object keys either side of the "|". Defaults to
   * {value, label} — FAQs, for instance, override it to {question, answer}.
   */
  pairKeys?: [string, string];
  /** Shown under the input — used for SEO guidance and format hints. */
  help?: string;
  /** Soft character budget; the editor shows a counter and warns past it. */
  recommendedMax?: number;
  /** Groups fields into a labelled section inside the expanded row. */
  group?: string;
}

/** The sidebar groups, in the order they are shown. */
export const NAV_GROUPS = [
  { id: 'content', label: 'Content' },
  { id: 'site', label: 'Site' },
] as const;

export type NavGroupId = (typeof NAV_GROUPS)[number]['id'];

export interface CollectionSpec {
  /** Key on PortfolioData holding the array. */
  key:
    | 'projects'
    | 'services'
    | 'blogs'
    | 'blogCategories'
    | 'gallery'
    | 'tools'
    | 'process'
    | 'social'
    | 'stats'
    | 'disciplines';
  label: string;
  /**
   * Which sidebar group the dashboard files this collection under.
   *
   * Data rather than a lookup table in the shell: a second list of keys
   * somewhere else is a list that silently goes stale the day a collection is
   * added, leaving the new section unreachable from the navigation.
   */
  group: NavGroupId;
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
    label: 'Work',
    group: 'content',
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
    group: 'content',
    titleField: 'title',
    slugField: 'slug',
    publishedField: 'published',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'slug', label: 'URL slug', help: 'Becomes /services/<slug>. Changing it breaks existing links.' },
      // A dropdown, not free text. `lib/sanitize.ts` treats anything that is
      // not exactly "pointer" as "page", so typing "Pointer" here used to
      // silently publish a competing page on this domain for a service
      // limicreatives.com already ranks for.
      { key: 'mode', label: 'Mode', kind: 'select', options: ['page', 'pointer'],
        help: '"page" builds a page here. "pointer" links out to Limi Creatives instead — use it for any service limicreatives.com already has a page for.' },
      { key: 'externalUrl', label: 'Points to', help: 'Required when mode is "pointer".' },
      { key: 'icon', label: 'Icon name', help: 'A lucide icon name, e.g. "Palette".' },
      { key: 'startingAt', label: 'Starting price', help: 'Optional anchor, e.g. "from $2,000".' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
      { key: 'deliverables', label: 'Deliverables', kind: 'list', help: 'One per line. Shown on the services page.' },
      { key: 'body', label: 'Page body', kind: 'markdown', rows: 18, group: 'Content',
        help: 'Aim for 600+ words. This is what actually ranks.' },
      { key: 'seoTitle', label: 'SEO title', recommendedMax: 60, group: 'SEO',
        help: 'Include the service and the location, e.g. "Web Design & UI/UX in Nepal".' },
      { key: 'metaDescription', label: 'Meta description', kind: 'textarea', recommendedMax: 160, group: 'SEO' },
      { key: 'faqs', label: 'FAQs', kind: 'pairs', rows: 8, group: 'SEO', pairKeys: ['question', 'answer'],
        help: 'One per line as "question | answer". Emitted as FAQPage schema.' },
      { key: 'published', label: 'Published', kind: 'toggle' },
    ],
  },
  {
    key: 'blogs',
    label: 'Journal',
    group: 'content',
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
      // Without this control there is no way to file a post under a category,
      // every post stays uncategorised, and the prerenderer — which skips
      // empty categories — never emits a single category page.
      { key: 'categoryId', label: 'Category', kind: 'select', optionsFrom: 'blogCategories',
        emptyLabel: '— No category —', group: 'Post',
        help: 'Files the post under /blog/category/…. Categories are edited under "Journal categories"; one with no published post gets no page.' },

      { key: 'image', label: 'Cover image', kind: 'image', group: 'Media' },

      { key: 'excerpt', label: 'Excerpt', kind: 'textarea', rows: 3, group: 'Content', recommendedMax: 160, help: 'Shown in listings, and used as the meta description when none is set.' },
      { key: 'content', label: 'Body', kind: 'markdown', rows: 22, group: 'Content', help: 'Markdown. Use ## for section headings — they become the outline search engines read.' },

      { key: 'seoTitle', label: 'SEO title', group: 'Search', recommendedMax: 60, help: 'Overrides the browser tab and search result title. Falls back to the post title.' },
      { key: 'metaDescription', label: 'Meta description', kind: 'textarea', rows: 3, group: 'Search', recommendedMax: 160, help: 'The grey text under your link in search results. Falls back to the excerpt.' },
      { key: 'ogImage', label: 'Social share image', kind: 'image', group: 'Search', help: 'Shown when the link is shared. Falls back to the cover image.' },
    ],
  },
  {
    key: 'blogCategories',
    label: 'Journal categories',
    group: 'content',
    titleField: 'title',
    slugField: 'slug',
    fields: [
      { key: 'title', label: 'Title', help: 'e.g. "The Nepal Market".' },
      { key: 'slug', label: 'URL slug', help: 'Appears as /blog/category/your-slug. Leave blank to generate from the title.' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3, recommendedMax: 200, help: 'Intro paragraph on the category page. Used as the meta description when none is set.' },
      { key: 'seoTitle', label: 'SEO title', recommendedMax: 60, group: 'Search' },
      { key: 'metaDescription', label: 'Meta description', kind: 'textarea', rows: 3, recommendedMax: 160, group: 'Search' },
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    group: 'content',
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
    key: 'process',
    label: 'Process',
    group: 'site',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'iconName', label: 'Icon name', help: 'A lucide icon name, e.g. "Target".' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    group: 'site',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'iconName', label: 'Icon name', help: 'A lucide icon name.' },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    group: 'site',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL', help: 'Leave empty to show the label without a link.' },
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    group: 'site',
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
    group: 'site',
    titleField: 'key',
    fields: [
      { key: 'key', label: 'Name', help: 'The column heading, e.g. "Design".' },
      { key: 'blurb', label: 'Blurb', kind: 'textarea', rows: 2 },
      { key: 'items', label: 'Items', kind: 'list', help: 'One per line.' },
    ],
  },
];

/** A blank item with every field of a spec present and correctly typed. */
export const emptyItem = (spec: CollectionSpec): Record<string, unknown> => {
  const item: Record<string, unknown> = { id: crypto.randomUUID() };
  for (const field of spec.fields) {
    if (field.kind === 'list' || field.kind === 'images' || field.kind === 'pairs') item[field.key] = [];
    else if (field.kind === 'toggle') item[field.key] = field.key === 'published';
    // A select starts on its first option rather than on '', so the value the
    // dropdown displays is the value that gets saved.
    else if (field.kind === 'select') item[field.key] = field.options?.[0] ?? '';
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

/**
 * The choices a `select` offers, resolved against the content being edited.
 *
 * A static `options` list stays a plain list. An `optionsFrom` field reads the
 * named collection instead, showing each item's title while storing its id —
 * so the category dropdown follows whatever categories exist right now.
 *
 * A stored value that matches nothing (a category deleted or re-created since
 * the post was filed) is kept as a labelled choice rather than reset: dropping
 * it would silently destroy content on the next save.
 */
export const selectOptions = (
  field: FieldSpec,
  data: PortfolioData | undefined,
  value: string,
): SelectOption[] => {
  if (!field.optionsFrom) {
    return (field.options ?? []).map((option) => ({ value: option, label: option }));
  }

  const source = COLLECTIONS.find((spec) => spec.key === field.optionsFrom);
  const items = (data?.[field.optionsFrom] ?? []) as unknown as Array<Record<string, unknown>>;

  const options: SelectOption[] = [
    { value: '', label: field.emptyLabel ?? 'None' },
    ...items.map((item) => ({
      value: String(item.id ?? ''),
      label: String((source ? item[source.titleField] : '') ?? '').trim() || 'Untitled',
    })),
  ];

  if (value && !options.some((option) => option.value === value)) {
    options.push({ value, label: `${value} — no longer exists` });
  }

  return options;
};
