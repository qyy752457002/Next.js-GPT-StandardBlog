/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      's.gravatar.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'media.licdn.com',
    ],
  },
};

module.exports = nextConfig;
