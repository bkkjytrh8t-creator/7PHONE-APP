'use client';

import {useEffect, useState} from 'react';

export function FallbackImage({
  src,
  alt,
  className,
  children,
  loading,
  onLoad
}: {
  src?: string | null;
  alt: string;
  className: string;
  children: React.ReactNode;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <>{children}</>;
  }

  return <img alt={alt} className={className} decoding="async" loading={loading} src={src} onError={() => setHasError(true)} onLoad={onLoad} />;
}
