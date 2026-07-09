import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lifescript-demo.vercel.app"),
  title: "人生剧本 | LifeScript",
  description:
    "输入你的大学信息，AI为你生成一部专属互动短剧——在关键分叉点做不同选择，看见你的每一种平行人生",
  applicationName: "人生剧本 LifeScript",
  keywords: [
    "人生剧本",
    "LifeScript",
    "QQ",
    "AI 社交",
    "互动短剧",
    "腾讯 PCG",
  ],
  authors: [{ name: "Stanley0601" }],
  openGraph: {
    title: "人生剧本 | LifeScript",
    description:
      "遇到一些有故事的人，在深夜聊聊天，彼此陪伴。",
    siteName: "人生剧本 LifeScript",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "人生剧本 | LifeScript",
    description:
      "遇到一些有故事的人，在深夜聊聊天，彼此陪伴。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}