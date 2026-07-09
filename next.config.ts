import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 生产部署使用 standalone 模式
  // CloudBase 静态导出由 deploy-cloudbase.sh 脚本控制
  ...(process.env.STATIC_EXPORT === "true"
    ? { output: "export" as const }
    : { output: "standalone" as const }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
