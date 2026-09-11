import React from 'react';
import { Link } from 'react-router-dom';
import { breadcrumbTrail } from '../lib/routes';

/**
 * Visible breadcrumb trail. The matching BreadcrumbList schema is emitted
 * separately by lib/seoGraph.ts — Google wants both, and it is the visible
 * trail that earns the breadcrumb display in the SERP.
 */
const Breadcrumbs: React.FC<{ path: string; title: string }> = ({ path, title }) => {
  const trail = breadcrumbTrail(path, title);
  if (trail.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="mono mb-8 text-[var(--grey-1)]">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {isLast ? (
                <span aria-current="page" className="text-[var(--ink)]">{crumb.name}</span>
              ) : (
                <Link to={crumb.path} className="link-wipe hover:text-[var(--ink)]">{crumb.name}</Link>
              )}
              {!isLast && <span aria-hidden="true" className="opacity-40">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
