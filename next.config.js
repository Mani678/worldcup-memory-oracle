/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@mysten-incubation/memwal']
  }
}

module.exports = nextConfig
