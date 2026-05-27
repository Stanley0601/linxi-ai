import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // 静态导出时排除 API routes（它们在纯前端模式下不需要）
  // CloudBase 静态托管 + 客户端直连 DeepSeek API
};

export default nextConfig;
