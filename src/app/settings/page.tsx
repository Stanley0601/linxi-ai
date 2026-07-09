"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * /settings 页面
 * 
 * 灵犀开发者设置：切换 online/offline 模式、配置用户ID
 */
export default function SettingsPage() {
  const [chatMode, setChatMode] = useState<"online" | "offline">(() => {
    if (typeof window === "undefined") return "offline";
    return (localStorage.getItem("linxi_chat_mode") || "offline") as "online" | "offline";
  });
  const [userId, setUserId] = useState(() => {
    if (typeof window === "undefined") return "local-user";
    return localStorage.getItem("linxi_user_id") || "local-user";
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem("linxi_chat_mode", chatMode);
    localStorage.setItem("linxi_user_id", userId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">⚙️ 灵犀 开发者设置</h1>

        {/* 聊天模式 */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">聊天模式</label>
          <div className="flex gap-3">
            <button
              onClick={() => setChatMode("offline")}
              className={`flex-1 py-3 px-4 rounded-lg border transition ${
                chatMode === "offline"
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">🔌 Offline</div>
              <div className="text-xs mt-1 opacity-70">前端状态机（无需服务器）</div>
            </button>
            <button
              onClick={() => setChatMode("online")}
              className={`flex-1 py-3 px-4 rounded-lg border transition ${
                chatMode === "online"
                  ? "border-green-500 bg-green-500/20 text-green-300"
                  : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
              }`}
            >
              <div className="font-medium">🌐 Online</div>
              <div className="text-xs mt-1 opacity-70">LangGraph Agent（需要 DB + LLM）</div>
            </button>
          </div>
        </div>

        {/* 用户ID */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">用户 ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full py-2 px-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            placeholder="test-user-001"
          />
          <p className="text-xs text-gray-500 mt-1">对应数据库中的用户ID，用于识别对话和关系</p>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          {saved ? "✅ 已保存" : "保存设置"}
        </button>

        {/* 状态信息 */}
        <div className="mt-8 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">当前状态</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 模式: <span className={chatMode === "online" ? "text-green-400" : "text-blue-400"}>{chatMode}</span></p>
            <p>• 用户ID: <span className="text-gray-300">{userId}</span></p>
            <p>• API: <span className="text-gray-300">/api/chat/v2</span></p>
          </div>
        </div>

        {/* 返回主页 */}
        <Link
          href="/"
          className="block mt-4 text-center text-sm text-gray-500 hover:text-gray-300 transition"
        >
          ← 返回灵犀
        </Link>
      </div>
    </div>
  );
}
