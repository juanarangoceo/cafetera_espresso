'use client';

import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import { usePathname } from 'next/navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';

const PRIVATE_PREFIXES = ['/admin', '/platform', '/intake', '/login', '/dashboard', '/auth'];

export default function SiteAnalytics() {
  const pathname = usePathname();
  if (PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <>
      <SpeedInsights />
      <GoogleAnalytics gaId="G-HKC4P9Y4N7" />
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '562585775680913');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}
