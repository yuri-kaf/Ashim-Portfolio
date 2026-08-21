import React from 'react';
import * as icons from 'lucide-react';
import { Circle } from 'lucide-react';

interface DynamicIconProps {
  /** A lucide-react export name, e.g. "Target". Stored as content. */
  name: string;
  size?: number;
  className?: string;
}

/**
 * Renders a lucide icon chosen by name at runtime.
 *
 * Icon choice is content now — process steps and tools carry an `iconName` the
 * owner can edit — so the component has to resolve a string rather than an
 * imported reference. An unknown or misspelled name falls back to a neutral
 * circle instead of crashing the page, since the name comes from a text input.
 */
const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 16, className }) => {
  const candidate = (icons as unknown as Record<string, unknown>)[name];
  const Resolved =
    typeof candidate === 'function' || (candidate && typeof candidate === 'object')
      ? (candidate as React.ComponentType<{ size?: number; className?: string }>)
      : Circle;

  return <Resolved size={size} className={className} />;
};

export default DynamicIcon;
