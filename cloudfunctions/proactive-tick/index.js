/**
 * CloudBase 云函数：定时触发器 → 调用应用的 /api/cron/tick
 *
 * 环境变量（在云函数配置中设置）：
 *   APP_BASE_URL —— 云托管应用地址，如 https://your-app.ap-shanghai.run.tcloudbase.com
 *   CRON_SECRET  —— 与应用侧 CRON_SECRET 一致的密钥
 *
 * 触发器配置见 cloudbaserc.json（每 5 分钟一次）。
 */

const https = require("https");
const http = require("http");

exports.main = async () => {
  const baseUrl = process.env.APP_BASE_URL;
  const secret = process.env.CRON_SECRET;

  if (!baseUrl || !secret) {
    return { ok: false, error: "APP_BASE_URL / CRON_SECRET not configured" };
  }

  const url = new URL("/api/cron/tick", baseUrl);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve) => {
    const req = client.request(
      url,
      {
        method: "POST",
        headers: { "x-cron-secret": secret, "Content-Length": 0 },
        timeout: 15000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          console.log(`tick status=${res.statusCode} body=${body.slice(0, 200)}`);
          resolve({ ok: res.statusCode === 200, status: res.statusCode, body });
        });
      },
    );
    req.on("error", (err) => {
      console.error("tick error:", err.message);
      resolve({ ok: false, error: err.message });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.end();
  });
};
