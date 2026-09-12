import React from 'react';
import { Circle } from 'lucide-react';
import { DynamicIcon as LucideDynamicIcon, iconNames } from 'lucide-react/dynamic';

interface DynamicIconProps {
  /** A lucide-react export name, e.g. "Target". Stored as content. */
  name: string;
  size?: number;
  className?: string;
}

/** "ArrowUpRight" / "arrowUpRight" -> "arrow-up-right", lucide's own key format. */
const toKebab = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

const KNOWN = new Set<string>(iconNames);

/**
 * Renders a lucide icon chosen by name at runtime.
 *
 * Icon choice is content now — process steps and tools carry an `iconName` the
 * owner can edit — so the component has to resolve a string rather than an
 * imported reference. An unknown or misspelled name falls back to a neutral
 * circle instead of crashing the page, since the name comes from a text input.
 *
 * Resolution goes through lucide's own `DynamicIcon`, which imports the single
 * icon it needs. The obvious alternative, `import * as icons from
 * 'lucide-react'`, is a dynamic property lookup on a namespace object, so
 * nothing can be tree-shaken and all ~1900 icons land in the bundle — that one
 * import was 860 kB of the old single chunk. Here the icon arrives as its own
 * sub-kilobyte chunk and `Circle` holds the space until it does.
 */
const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 16, className }) => {
  // Stable identity: lucide renders `fallback` as a component, so a fresh
  // function each render would remount the placeholder on every render.
  const Fallback = React.useCallback(
    () => <Circle size={size} className={className} />,
    [size, className],
  );

  const kebab = toKebab(name);
  if (!KNOWN.has(kebab)) return <Circle size={size} className={className} />;

  return (
    <LucideDynamicIcon
      name={kebab as Parameters<typeof LucideDynamicIcon>[0]['name']}
      size={size}
      // The per-icon components add a `lucide-<name>` class of their own; the
      // generic renderer behind DynamicIcon only knows the node, so pass it
      // through to keep the markup identical to the namespace version.
      className={`lucide-${kebab}${className ? ` ${className}` : ''}`}
      fallback={Fallback}
    />
  );
};

export default DynamicIcon;
