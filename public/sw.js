/* 灵犀 Service Worker —— 接收 Web Push，页面关着也能收到"TA 主动找你" */

self.addEventListener("push", event => {
  if (!event.data) return;

  let payload = { title: "灵犀", body: "有人给你发来了消息", characterId: "" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    payload.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.characterId ? `/avatars/${payload.characterId}.png` : "/avatars/user.png",
      badge: "/favicon.ico",
      tag: `linxi-${payload.characterId || "default"}`, // 同角色通知合并
      data: { characterId: payload.characterId },
    }),
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
