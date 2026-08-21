
import { PortfolioData } from './types.js';
import { DIGITAL_MARKETING_LOTTIE } from './assets/lottieData.js';

export const INITIAL_DATA: PortfolioData = {
  name: "Ashim Kafle",
  role: "Product Designer & Digital Marketer",
  tagline: "Design that looks sharp and marketing that makes it sell.",
  availability: 'available',
  company: {
    name: "Limi Creatives",
    role: "Co-founder & CMO",
    description: "A creative agency delivering design, branding, and full-service marketing.",
    url: ""
  },
  vibe: {
    title: "The Crimson Approach",
    description: "I believe design is about how it makes you feel, rooted in clarity and resonance.",
    philosophy: [
      "Simplicity is the ultimate sophistication.",
      "Every pixel must justify its existence.",
      "Design for humans, not for algorithms.",
      "Bold choices create lasting impressions."
    ]
  },
  projects: [
    {
      id: "1",
      title: "Vortex Crypto",
      category: "Fintech",
      description: "Secure digital asset management with high-speed feedback cycles.",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Simplifying blockchain data for the average user using high-contrast visuals.",
      year: "2024",
      client: "Vortex Labs"
    },
    {
      id: "2",
      title: "Solstice Fashion",
      category: "E-Commerce",
      description: "Luxury fashion minimalist experience for the modern aesthetic.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Aggressive whitespace and elegant typography to elevate brand presence.",
      year: "2023",
      client: "Solstice Group"
    },
    {
      id: "3",
      title: "Nova Dashboard",
      category: "SaaS",
      description: "Real-time global logistics analytics and deep data visualization.",
      image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "A 'layers of detail' strategy zooming from global metrics to individual shipments.",
      year: "2024",
      client: "Nova Logistics"
    },
    {
      id: "4",
      title: "Zenith Banking",
      category: "Fintech",
      description: "Next-gen multi-currency banking built for digital nomads.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Focused on frictionless cross-border transactions and UX security.",
      year: "2024",
      client: "Zenith Corp"
    },
    {
      id: "5",
      title: "Aura Skincare",
      category: "Branding",
      description: "Premium identity design communicating purity and scientific rigor.",
      image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?q=80&w=1200&auto=format&fit=crop",
      caseStudy: "Creating a visual language that communicates organic quality.",
      year: "2023",
      client: "Aura Beauty"
    }
  ],
  services: [
    {
      id: "s1",
      title: "UI/UX Design",
      description: "Aesthetic digital interfaces for mobile and web platforms.",
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1200&auto=format&fit=crop",
      icon: "Layers"
    },
    {
      id: "s2",
      title: "Brand Identity",
      description: "Iconic visual languages that define and elevate brand presence.",
      image: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop",
      icon: "Zap"
    },
    {
      id: "s3",
      title: "Digital Marketing",
      description: "Strategic growth campaigns maximizing global reach and ROI.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop",
      icon: "Globe",
      lottieData: DIGITAL_MARKETING_LOTTIE
    },
    {
      id: "s4",
      title: "Performance Marketing",
      description: "Paid acquisition across Meta and Google, built to lower cost per result month over month.",
      image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?q=80&w=1200&auto=format&fit=crop",
      icon: "TrendingUp"
    },
    {
      id: "s5",
      title: "SEO & Content",
      description: "Search and content systems that compound into traffic you don't have to keep paying for.",
      image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=1200&auto=format&fit=crop",
      icon: "Search"
    },
    {
      id: "s6",
      title: "Motion & Animation",
      description: "Characters and motion work that give a brand a personality people remember.",
      image: "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?q=80&w=1200&auto=format&fit=crop",
      icon: "Sparkles"
    }
  ],
  process: [
    { id: "p1", title: "Strategy", description: "Deep dive into goals, user personas, and competitive landscape." },
    { id: "p2", title: "Wireframe", description: "Architecting the core user flow and low-fidelity skeletons." },
    { id: "p3", title: "Visuals", description: "Applying the crimson vibe and high-fidelity aesthetics." },
    { id: "p4", title: "Deploy", description: "Seamless transition from design files to a live product." }
  ],
  tools: [
    { id: "t1", name: "Figma", iconName: "figma" },
    { id: "t2", name: "Framer", iconName: "framer" },
    { id: "t3", name: "Blender", iconName: "box" },
    { id: "t4", name: "Notion", iconName: "book" },
    { id: "t5", name: "React", iconName: "code" },
    { id: "t6", name: "Webflow", iconName: "globe" }
  ],
  // PLACEHOLDERS — swap the `image` values for real photos of you working.
  // Drop files into /public and reference them as "/my-photo.jpg", or paste any URL.
  gallery: [
    { id: "g1", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1400&auto=format&fit=crop", caption: "Studio session", size: "lg" },
    { id: "g2", image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop", caption: "Client workshop", size: "sm" },
    { id: "g3", image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop", caption: "Late-night wireframes", size: "md" },
    { id: "g4", image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1000&auto=format&fit=crop", caption: "The desk", size: "sm" },
    { id: "g5", image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1400&auto=format&fit=crop", caption: "Sketching the system", size: "md" },
    { id: "g6", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000&auto=format&fit=crop", caption: "Reviewing the numbers", size: "sm" },
    { id: "g7", image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1400&auto=format&fit=crop", caption: "Pinning up the work", size: "lg" },
    { id: "g8", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1400&auto=format&fit=crop", caption: "Team sync", size: "md" }
  ],
  blogs: [
    {
      id: "b1",
      title: "The Future of Minimalist Design",
      excerpt: "Why less is becoming even more in the age of content overload.",
      content: "As we move into 2025, the noise level in digital interfaces is reaching a breaking point...",
      date: "Oct 12, 2024",
      readTime: "5 min",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "b2",
      title: "Why Red is the Color of 2025",
      excerpt: "Exploring the impact of bold crimson in modern interfaces.",
      content: "Red has always been a color of passion, urgency, and power...",
      date: "Nov 05, 2024",
      readTime: "4 min",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop"
    }
  ],
  social: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ashim-kafle-676a312a5/',
    },
    { id: 'dribbble', label: 'Dribbble', url: '' },
    { id: 'instagram', label: 'Instagram', url: '' },
  ],
};
