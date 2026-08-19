import React from 'react';

/**
 * Inline brand marks for the hero's floating tool badges.
 *
 * These were previously <img> tags pointing at cdn.worldvectorlogo.com. Several
 * of those URLs now 404, which left blank badges in the hero, and the rest are
 * one upstream change away from doing the same. Inlining them removes the
 * network dependency entirely.
 */

type LogoProps = { className?: string };

export const FigmaLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 38 57" className={className} role="img" aria-label="Figma">
    <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
    <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 0 1-19 0z" />
    <path fill="#ff7262" d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19V0z" />
    <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 1 9.5 0H19v19H9.5A9.5 9.5 0 0 1 0 9.5z" />
    <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 1 9.5 19H19v19H9.5A9.5 9.5 0 0 1 0 28.5z" />
  </svg>
);

/** Shared shape for the Adobe app tiles. */
const AdobeTile: React.FC<{
  bg: string;
  fg: string;
  letters: string;
  label: string;
  className?: string;
}> = ({ bg, fg, letters, label, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-label={label}>
    <rect width="24" height="24" rx="5" fill={bg} />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fill={fg}
      fontSize="11"
      fontWeight="700"
      fontFamily="Outfit, ui-sans-serif, system-ui, sans-serif"
    >
      {letters}
    </text>
  </svg>
);

export const IllustratorLogo: React.FC<LogoProps> = ({ className }) => (
  <AdobeTile bg="#330000" fg="#ff9a00" letters="Ai" label="Adobe Illustrator" className={className} />
);

export const PhotoshopLogo: React.FC<LogoProps> = ({ className }) => (
  <AdobeTile bg="#001e36" fg="#31a8ff" letters="Ps" label="Adobe Photoshop" className={className} />
);

export const FramerLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Framer">
    <path fill="#0055ff" d="M4 1h16v7.5h-8.5zM4 8.5h8.5L20 16H4zM4 16h8v7z" />
  </svg>
);

export const MetaLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} role="img" aria-label="Meta">
    <path
      d="M2.5 12.4c0-3.1 1.7-5.6 4-5.6 2.1 0 3.4 1.7 4.7 4 .5.9.9 1.7 1.3 2.5.4-.8.8-1.6 1.3-2.5 1.3-2.3 2.6-4 4.7-4 2.3 0 4 2.5 4 5.6s-1.6 5.2-3.7 5.2c-1.9 0-3.2-1.5-4.4-3.6l-.9-1.6-.9 1.6c-1.2 2.1-2.5 3.6-4.4 3.6-2.1 0-3.7-2.1-3.7-5.2z"
      fill="none"
      stroke="#0081fb"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
