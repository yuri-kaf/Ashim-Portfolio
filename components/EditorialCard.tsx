import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

/**
 * The card language for the whole site: a hard-edged image plate, a rule, then
 * the title set in display caps with mono metadata beside it.
 *
 * This replaces the earlier rounded, drop-shadowed `card-physical` treatment,
 * which read as a different design system to the editorial landing page.
 */

interface EditorialCardProps {
  to: string;
  image: string;
  title: string;
  /** Small right-aligned label on the title row — category, read time, etc. */
  meta?: string;
  /** Quieter line under the rule — year, date. */
  submeta?: string;
  /** Optional body copy under the metadata. */
  description?: string;
  /** Two-digit index stamped over the image. */
  index?: number;
  /** Image aspect ratio; the landing strip uses 4/5, grids often want 4/3. */
  aspect?: string;
  className?: string;
  /** Renders as a button instead of a router link (used by the blog reader). */
  onClick?: () => void;
}

const CardBody: React.FC<Omit<EditorialCardProps, 'to' | 'onClick'>> = ({
  image,
  title,
  meta,
  submeta,
  description,
  index,
  aspect = 'aspect-[4/5]',
}) => (
  <>
    <div className={`relative ${aspect} overflow-hidden bg-neutral-200`}>
      {image ? (
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover grayscale transition-all duration-[1.1s] ease-out group-hover:scale-[1.05] group-hover:grayscale-0"
        />
      ) : (
        // No cover: the title on ink, rather than an <img src=""> that
        // renders a broken-image icon or re-requests the page.
        <div className="absolute inset-0 flex items-end bg-[var(--ink)] p-6">
          <span className="display line-clamp-4 text-2xl leading-[1.05] text-[var(--paper)]">{title}</span>
        </div>
      )}

      {typeof index === 'number' && (
        <span className="mono absolute left-4 top-4 text-white mix-blend-difference">
          {String(index + 1).padStart(2, '0')}
        </span>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 scale-75 items-center justify-center rounded-full bg-white opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
          <ArrowUpRight size={20} className="text-[var(--ink)]" />
        </span>
      </div>
    </div>

    <div className="flex items-baseline justify-between gap-4 border-t border-[var(--ink)] pt-3">
      <h3 className="mega text-xl md:text-2xl">{title}</h3>
      {meta && <span className="mono shrink-0 text-[var(--grey-1)]">{meta}</span>}
    </div>

    {submeta && <p className="mono mt-1 text-[var(--grey-2)]">{submeta}</p>}

    {description && (
      <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-[var(--grey-1)]">
        {description}
      </p>
    )}
  </>
);

const EditorialCard: React.FC<EditorialCardProps> = ({ to, onClick, className = '', ...rest }) => {
  if (onClick) {
    return (
      <button onClick={onClick} className={`group block w-full text-left ${className}`}>
        <CardBody {...rest} />
      </button>
    );
  }

  return (
    <Link to={to} className={`group block ${className}`}>
      <CardBody {...rest} />
    </Link>
  );
};

export default EditorialCard;
