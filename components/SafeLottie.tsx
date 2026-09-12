import React from 'react';

/**
 * Hardened wrapper around lottie-react.
 *
 * lottie-web throws while parsing if a precomp layer (`ty: 0`) points at a
 * refId that isn't present in `assets` — it dereferences the missing comp and
 * reads a property off null. Because that happens during render, one bad
 * animation took down the entire app rather than just its own card.
 *
 * Two layers of defence:
 *   1. `sanitizeAnimationData` drops layers that can't resolve.
 *   2. An error boundary catches anything else and shows `fallback` instead.
 *
 * lottie-react (and the lottie-web player underneath it) is ~315 kB, and a
 * service with no animation never needs a frame of it — so the player is
 * imported only once there is animation data that survives sanitising. Until
 * the chunk lands, `fallback` — normally the service's still image — holds the
 * space, which is exactly what this component already renders when there is
 * nothing to animate.
 */

const Lottie = React.lazy(() => import('lottie-react'));

interface LottieJSON {
  layers?: any[];
  assets?: any[];
  [key: string]: any;
}

export const sanitizeAnimationData = (data: unknown): LottieJSON | null => {
  if (!data || typeof data !== 'object') return null;

  const animation = data as LottieJSON;
  if (!Array.isArray(animation.layers)) return null;

  const assetIds = new Set(
    (Array.isArray(animation.assets) ? animation.assets : [])
      .map((asset: any) => asset?.id)
      .filter(Boolean),
  );

  const layers = animation.layers.filter((layer: any) => {
    if (!layer || typeof layer !== 'object') return false;
    // Precomp and image layers are the only ones that resolve through `assets`.
    const needsAsset = layer.ty === 0 || layer.ty === 2;
    if (needsAsset && !assetIds.has(layer.refId)) return false;
    return true;
  });

  if (layers.length === 0) return null;

  return { ...animation, layers };
};

interface BoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

class LottieBoundary extends React.Component<BoundaryProps, { failed: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Lottie animation failed to render; showing fallback instead.', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface SafeLottieProps {
  animationData: unknown;
  className?: string;
  /** Shown when the animation is unusable — normally the service's still image. */
  fallback?: React.ReactNode;
}

const SafeLottie: React.FC<SafeLottieProps> = ({ animationData, className, fallback = null }) => {
  // Memoised so we don't re-filter a large JSON blob on every render.
  const safeData = React.useMemo(() => sanitizeAnimationData(animationData), [animationData]);

  if (!safeData) return <>{fallback}</>;

  return (
    <LottieBoundary fallback={<>{fallback}</>}>
      <React.Suspense fallback={<>{fallback}</>}>
        <Lottie animationData={safeData} loop className={className} />
      </React.Suspense>
    </LottieBoundary>
  );
};

export default SafeLottie;
