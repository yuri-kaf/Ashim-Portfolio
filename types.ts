
export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  caseStudy: string;
  year: string;
  client: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  icon: string;
  lottieData?: any; // Added to support animations
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  image: string;
}

export interface ProcessStep {
  id: string;
  title: string;
  description: string;
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

/**
 * A social profile link. An entry with an empty `url` renders as an inert
 * label rather than a dead link — the hardcoded "#" placeholders used to do
 * this, and `#` is no longer safe now that the app uses real paths.
 */
export interface SocialLink {
  id: string;
  label: string;
  url: string;
}

export interface PortfolioData {
  name: string;
  role: string;
  tagline: string;
  company: Company;
  availability: 'available' | 'busy' | 'vacation';
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
