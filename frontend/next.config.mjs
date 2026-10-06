/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "https://adaptflow-production.up.railway.app"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
