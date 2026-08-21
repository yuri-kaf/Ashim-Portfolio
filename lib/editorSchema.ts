export type FieldKind = 'text' | 'textarea' | 'image';

export interface FieldSpec {
  key: string;
  label: string;
  kind?: FieldKind;
  rows?: number;
}

export interface CollectionSpec {
  /** Key on PortfolioData holding the array. */
  key: 'projects' | 'services' | 'blogs' | 'gallery' | 'tools' | 'process' | 'social';
  label: string;
  /** Field shown as the row heading in the collapsed list. */
  titleField: string;
  fields: FieldSpec[];
}

/**
 * Describes each collection so one editor component can render all of them.
 * Field keys are asserted against INITIAL_DATA in the tests, which is what
 * keeps a typo here from silently producing an input bound to nothing.
 */
export const COLLECTIONS: CollectionSpec[] = [
  {
    key: 'projects',
    label: 'Projects',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'client', label: 'Client' },
      { key: 'category', label: 'Category' },
      { key: 'year', label: 'Year' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
      { key: 'caseStudy', label: 'Case study', kind: 'textarea', rows: 8 },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'icon', label: 'Icon name' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'blogs',
    label: 'Journal',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'date', label: 'Date' },
      { key: 'readTime', label: 'Read time' },
      { key: 'image', label: 'Image', kind: 'image' },
      { key: 'excerpt', label: 'Excerpt', kind: 'textarea', rows: 3 },
      { key: 'content', label: 'Content', kind: 'textarea', rows: 12 },
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
      { key: 'size', label: 'Size (sm / md / lg)' },
      { key: 'image', label: 'Image', kind: 'image' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Name' },
      { key: 'iconName', label: 'Icon name' },
    ],
  },
  {
    key: 'process',
    label: 'Process',
    titleField: 'title',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', kind: 'textarea', rows: 3 },
    ],
  },
  {
    key: 'social',
    label: 'Social links',
    titleField: 'label',
    fields: [
      { key: 'label', label: 'Label' },
      { key: 'url', label: 'URL — leave empty to show it as inert' },
    ],
  },
];

/** A blank item with every field of a spec present as an empty string. */
export const emptyItem = (spec: CollectionSpec): Record<string, string> => {
  const item: Record<string, string> = { id: crypto.randomUUID() };
  for (const field of spec.fields) item[field.key] = '';
  return item;
};

export type CollectionKey = CollectionSpec['key'];
