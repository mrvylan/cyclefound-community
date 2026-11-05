import { FEATURES, type FeatureKey } from "@/lib/features";

/** Renders children only when the named feature flag is on. Keep deferred UI behind this. */
export function Feature({
  name,
  children,
  fallback = null,
}: {
  name: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return FEATURES[name] ? <>{children}</> : <>{fallback}</>;
}
