import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注意：不要设置 output: "export"（静态导出）。
  // /api/chat 和 /api/summary 依赖服务端运行时，静态导出会让它们失效，
  // 且服务端是 API Key 唯一安全的存放位置。
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
