/**
 * 匿名设备用户 ID（v1 身份方案）
 * 生成一次后存 localStorage，所有服务端同步请求携带。
 * 后续接入微信登录后，可把这个 ID 迁移绑定到真实账号。
 */

const UID_KEY = "linxi_uid";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
      uid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(UID_KEY, uid);
    }
    return uid;
  } catch {
    return "";
  }
}
