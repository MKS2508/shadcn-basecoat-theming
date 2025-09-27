/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  transpilePackages: [
    '@mks2508/theme-manager-react',
    '@mks2508/shadcn-basecoat-theme-manager'
  ],
};

export default nextConfig;