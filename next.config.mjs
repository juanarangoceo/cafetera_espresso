import { withBotId } from 'botid/next/config';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'rsqcumtozynvzsctvmpk.supabase.co',
        pathname: '/storage/v1/object/public/site-logos/**',
      },
    ],
  },
};

export default withBotId(nextConfig);
