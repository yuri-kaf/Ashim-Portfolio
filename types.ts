/** A measurable outcome shown on a case study, e.g. "+180%" / "organic traffic". */
export interface ProjectResult {
  id: string;
  value: string;
  label: string;
}

export interface Project {
  id: string;
  /** URL segment. Falls back to `id` when empty, so old links keep working. */
  slug: string;
  title: string;
  /** One line under the title on the detail page. */
  subtitle: string;
  category: string;
  description: string;
  image: string;
  /** Additional images shown through the case study. */
  images: string[];
  /** Long-form narrative, kept for projects written before the split fields. */
  caseStudy: string;
  challenge: string;
  approach: string;
  outcome: string;
  results: ProjectResult[];
  year: string;
  client: string;
  /** Your role on the project. */
  role: string;
  /** How long it ran, e.g. "6 weeks". */
  timeline: string;
  /** What was delivered — rendered as tags. */
  services: string[];
  /** Link to the live product, if public. */
  liveUrl: string;
  /** Pins the project to the front of listings. */
  featured: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string;
  /** Bullet list shown on the services page. */
  deliverables: string[];
  /** Optional price anchor, e.g. "from $2,000". */
  startingAt: string;
  lottieData?: any; // Added to support animations
}

export interface Blog {
  id: string;
  /** URL segment for /blog/:slug. */
  slug: string;
  title: string;
  excerpt: string;
  /** Markdown body. */
  content: string;
  date: string;
  readTime: string;
  image: string;
  author: string;
  tags: string[];
  /** Only published posts appear on the public site. */
  published: boolean;
  /** Overrides the <title> tag; falls back to `title`. */
  seoTitle: string;
  /** Overrides the meta description; falls back to `excerpt`. */
  metaDescription: string;
  /** Overrides the social preview image; falls back to `image`. */
  ogImage: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  /** lucide-react icon name, e.g. "Target". */
  iconName: string;
}

export interface Tool {
  id: string;
  name: string;
  iconName: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  /** Controls how much space the item takes in the gallery mosaic. */
  size?: 'sm' | 'md' | 'lg';
}

/** Current position, surfaced across the site as a credential. */
export interface Company {
  name: string;
  role: string;
  description: string;
  url?: string;
}

export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

/** A headline figure in the hero and on the works page. */
export interface Stat {
  id: string;
  value: string;
  suffix: string;
  label: string;
}

/** One half of the practice, shown side by side on the landing page. */
export interface Discipline {
  id: string;
  key: string;
  blurb: string;
  items: string[];
}

/** Everything reachable from a "contact me" affordance. */
export interface Contact {
  email: string;
  phone: string;
  location: string;
}

/** Copy that sits at the top of each route. */
export interface PageIntros {
  works: string;
  services: string;
  gallery: string;
  blog: string;
  vibe: string;
}

/** Site-wide metadata defaults; per-page values override these. */
export interface SeoDefaults {
  siteName: string;
  titleSuffix: string;
  description: string;
  ogImage: string;
  twitterHandle: string;
  /** Absolute origin, used to build canonical URLs and the sitemap. */
  siteUrl: string;
}

export interface PortfolioData {
  name: string;
  role: string;
  tagline: string;
  /** Short paragraph under the hero headline. */
  heroIntro: string;
  company: Company;
  availability: 'available' | 'busy' | 'vacation';
  contact: Contact;
  stats: Stat[];
  /** Phrases in the scrolling marquee. */
  ticker: string[];
  disciplines: Discipline[];
  pageIntros: PageIntros;
  seo: SeoDefaults;
  projects: Project[];
  services: Service[];
  blogs: Blog[];
  process: ProcessStep[];
  tools: Tool[];
  gallery: GalleryItem[];
  social: SocialLink[];
  vibe: {
    title: string;
    description: string;
    philosophy: string[];
  };
}
