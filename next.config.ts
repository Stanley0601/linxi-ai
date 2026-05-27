import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出由 deploy-cloudbase.sh 脚本控制
  // 本地开发时不启用（需要 API routes）
  ...(process.env.STATIC_EXPORT === "true" ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
