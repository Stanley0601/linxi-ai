# 腾讯云 CloudBase 部署指南

架构：**Next.js 应用跑在云托管（容器）**，数据存**云数据库**，**云函数定时触发器**驱动主动消息推送（Web Push）。

```
浏览器 ──HTTP──> 云托管 (Next.js, Dockerfile)
   │                 │
   │ Web Push        ├──> 云数据库 (scheduled_messages / chat_summaries / push_subscriptions)
   │                 └──> DeepSeek API (LLM_API_KEY 只在服务端)
   ▲
推送服务商 <──web-push── /api/cron/tick <──每5分钟── 云函数 proactive-tick (定时触发器)
```

## 前置

```bash
npm i -g @cloudbase/cli
tcb login
```

环境 ID 已在 `cloudbaserc.json`：`linxi-d2gcj01lm1b6d05c8`。

## 1. 创建数据库集合

控制台 → 云开发 → 数据库，创建三个集合（权限设为「仅服务端可读写」，客户端一律走 API 路由）：

- `scheduled_messages`
- `chat_summaries`
- `layered_memories`（分层记忆：事实库/情节/关系里程碑）
- `push_subscriptions`

给 `scheduled_messages` 加组合索引：`userId + triggered + realTriggerAt`，以及 `triggered + pushed + realTriggerAt`（cron 扫描用）。

## 2. 生成密钥

```bash
npx web-push generate-vapid-keys   # 得到 VAPID 公私钥
openssl rand -hex 32               # 得到 CRON_SECRET
```

## 3. 部署云托管

控制台 → 云托管 → 新建服务（如 `linxi-app`），关联本仓库或直接用 Dockerfile 构建。配置环境变量：

| 变量 | 说明 |
|---|---|
| `LLM_API_KEY` | DeepSeek key（**用新 key，旧的 sk-379b... 已泄露必须吊销**） |
| `CLOUDBASE_ENV_ID` | `linxi-d2gcj01lm1b6d05c8`（云托管内无需 SECRET_ID/KEY） |
| `WEB_PUSH_VAPID_PUBLIC_KEY` / `WEB_PUSH_VAPID_PRIVATE_KEY` | 第 2 步生成 |
| `WEB_PUSH_CONTACT` | `mailto:你的邮箱` |
| `CRON_SECRET` | 第 2 步生成 |
| `FOOTBALL_DATA_KEY` | 可选：足球真实比分，[football-data.org 免费注册](https://www.football-data.org/client/register)，token 发邮箱 |

部署完成后记下服务地址（形如 `https://linxi-app-xxx.ap-shanghai.run.tcloudbase.com`）。

## 4. 部署定时云函数

编辑 `cloudbaserc.json`，把 `APP_BASE_URL` 换成上一步的服务地址、`CRON_SECRET` 换成第 2 步的值，然后：

```bash
tcb fn deploy proactive-tick
```

验证：`tcb fn invoke proactive-tick`，日志应显示 `tick status=200`。

## 5. 本地开发连线上数据库（可选）

本地调试服务端存储时，在 `.env.local` 额外配置腾讯云 CAM 密钥：

```bash
CLOUDBASE_ENV_ID=linxi-d2gcj01lm1b6d05c8
CLOUDBASE_SECRET_ID=xxx    # 控制台 → 访问管理 → API密钥管理
CLOUDBASE_SECRET_KEY=xxx
```

不配置时应用自动降级为 localStorage-only，一切照常。

## 已知边界（v1）

- **身份是匿名设备 ID**（localStorage 里的 UUID），跨设备恢复记忆需要两台设备用同一个 ID；真正的账号体系（微信登录）在后续迭代。
- API 以 userId 为信任边界，尚无签名鉴权——正式对外前需要接入 CloudBase Auth。
- Web Push 在 iOS Safari 需要「添加到主屏幕」后才可用；微信内置浏览器不支持，后续可加小程序订阅消息通道。
