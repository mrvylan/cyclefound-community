import type { NextConfig } from "next";

const CLASSIC = "https://classic.cyclefound.com";

/** Marketplace Vite shells → classic. Do not redirect Community App Router routes (/auth, /messages, /market). */
const marketplaceHtmlRedirects = [
  "listing.html",
  "sell.html",
  "sell-import.html",
  "sellers.html",
  "parts.html",
  "part.html",
  "garage.html",
  "garage-bike.html",
  "ops.html",
  "auth.html",
  "account.html",
  "messages.html",
  "index.html",
  "marketplace-guidelines.html",
  "terms.html",
  "privacy.html",
  "copyright.html",
].map((file) => ({
  source: `/${file}`,
  destination: `${CLASSIC}/${file}`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      ...marketplaceHtmlRedirects,
      {
        source: "/founding-sellers",
        destination: `${CLASSIC}/sellers.html`,
        permanent: true,
      },
      {
        source: "/sell-import",
        destination: `${CLASSIC}/sell-import.html`,
        permanent: true,
      },
      {
        source: "/sellers",
        destination: `${CLASSIC}/sellers.html`,
        permanent: true,
      },
      {
        source: "/parts",
        destination: `${CLASSIC}/parts.html`,
        permanent: true,
      },
      {
        source: "/part",
        destination: `${CLASSIC}/part.html`,
        permanent: true,
      },
      {
        source: "/sell",
        destination: `${CLASSIC}/sell.html`,
        permanent: true,
      },
      {
        source: "/marketplace-guidelines",
        destination: `${CLASSIC}/marketplace-guidelines.html`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
