import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );
    config.resolve.fallback = { fs: false, net: false, tls: false, dns: false, child_process: false };
    config.externals.push("pino-pretty", "@react-native-async-storage/async-storage");
    return config;
  },
};

export default nextConfig;
