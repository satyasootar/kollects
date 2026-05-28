/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.STANDALONE_BUILD === "true" ? "standalone" : undefined,
};

export default nextConfig;
