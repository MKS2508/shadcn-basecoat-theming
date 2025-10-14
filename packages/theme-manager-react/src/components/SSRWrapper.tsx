import React from 'react';

/**
 * SSR Wrapper - Prevents hydration mismatches by hiding content until client-side
 */
interface SSRWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function SSRWrapper({ children, fallback = null, className = '' }: SSRWrapperProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Server-side rendering - show fallback or nothing
    return <>{fallback}</>;
  }

  // Client-side rendering - show actual content
  return <div className={className}>{children}</div>;
}

/**
 * SSR Safe Component - Only renders on client-side
 */
interface SSRSafeProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function SSRSafe({ children, fallback = null }: SSRSafeProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Client Only Script - Prevents hydration mismatches for scripts
 */
interface ClientOnlyScriptProps {
  children: string | (() => string);
  defer?: boolean;
  async?: boolean;
}

export function ClientOnlyScript({ children, defer = false, async = false }: ClientOnlyScriptProps) {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const scriptContent = typeof children === 'function' ? children() : children;

  return (
    <script
      defer={defer}
      async={async}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}