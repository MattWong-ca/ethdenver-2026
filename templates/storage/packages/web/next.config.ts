import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Strip the `node:` URI scheme — webpack 5 doesn't handle it by default
    // but already knows how to resolve `crypto`, `stream`, etc. without it.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    // Prevent bundling of Node-only modules in the browser
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
    };

    return config;
  },
};

export default nextConfig;
