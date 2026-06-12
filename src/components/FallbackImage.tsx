'use client';

import {useEffect, useState} from 'react';

export function FallbackImage({
  src,
  alt,
  className,
  children
}: {
  src?: string | null;
  alt: string;
  className: string;
  children: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <>{children}</>;
  }

  return <img alt={alt} className={className} src={src} onError={() => setHasError(true)} />;
}
