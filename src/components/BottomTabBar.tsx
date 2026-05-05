"use client";

import type { TabType } from "@/types";

// 精确还原QQ底部Tab栏：消息 / 频道 / 联系人 / 动态
export default function BottomTabBar({ current, onChange, unreadTotal, hasMomentsUpdate = false }: {
  current: TabType; onChange: (t: TabType) => void; unreadTotal: number; hasMomentsUpdate?: boolean;
}) {
  const tabs: { key: TabType; label: string }[] = [
    { key: "messages", label: "消息" },
    { key: "moments", label: "动态" },
    { key: "profile", label: "我的" },
  ];

  // QQ蓝
  const activeColor = "#0091FF";
  const inactiveColor = "#8A8A8A";

  return (
    <div className="flex-shrink-0 safe-area-bottom"
      style={{ background: "#ffffff", borderTop: "0.5px solid #E8E8E8" }}>
      <div className="flex items-center justify-around" style={{ height: 50 }} role="tablist" aria-label="底部导航">
        {tabs.map(t => {
          const isActive = current === t.key;
          return (
            <button key={t.key} onClick={() => onChange(t.key)}
              type="button"
              id={`${t.key}-tab`}
              aria-label={t.label}
              aria-selected={isActive}
              role="tab"
              aria-controls={`${t.key}-panel`}
              tabIndex={isActive ? 0 : -1}
              title={isActive ? `当前已在${t.label}` : `切换到${t.label}`}
              className="flex flex-col items-center justify-center gap-[2px] relative active:bg-[#f7f9fb] transition-colors"
              style={{ flex: 1, height: "100%" }}>

              {/* 图标 */}
              <div className="relative">
                {t.key === "messages" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="14" rx="2" stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5"
                      fill={isActive ? activeColor : "none"} />
                    {isActive ? (
                      <>
                        <path d="M7 9H17" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M7 12.5H14" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                      </>
                    ) : (
                      <>
                        <path d="M7 9H17" stroke={inactiveColor} strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M7 12.5H14" stroke={inactiveColor} strokeWidth="1.3" strokeLinecap="round"/>
                      </>
                    )}
                  </svg>
                )}
                {t.key === "moments" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5"
                      fill={isActive ? activeColor : "none"} />
                    {isActive ? (
                      <path d="M8 12C9 9 11 8 12 8C14 8 15 9.5 15 11C15 13 12 14 12 16" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                    ) : (
                      <path d="M8 12C9 9 11 8 12 8C14 8 15 9.5 15 11C15 13 12 14 12 16" stroke={inactiveColor} strokeWidth="1.3" strokeLinecap="round"/>
                    )}
                  </svg>
                )}
                {t.key === "profile" && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="9" r="4" stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5"
                      fill={isActive ? activeColor : "none"} />
                    <path d="M5 20C5 17 8 15 12 15C16 15 19 17 19 20" stroke={isActive ? activeColor : inactiveColor} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}

                {/* 未读红点 - 消息Tab */}
                {t.key === "messages" && unreadTotal > 0 && (
                  <span className="absolute -top-[4px] -right-[8px] min-w-[16px] h-[16px] px-[4px] rounded-full flex items-center justify-center"
                    style={{ background: "#FA5151", fontSize: 10, color: "white", fontWeight: 700, lineHeight: 1 }}>
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                    <span className="sr-only">未读消息 {unreadTotal > 99 ? "99+" : unreadTotal} 条</span>
                  </span>
                )}

                {/* 红点 - 动态Tab */}
                {t.key === "moments" && hasMomentsUpdate && !isActive && (
                  <span className="absolute -top-[2px] -right-[2px] w-[8px] h-[8px] rounded-full"
                    style={{ background: "#FA5151" }}>
                    <span className="sr-only">动态有更新</span>
                  </span>
                )}
              </div>

              {/* 文字 */}
              <span className="text-[10px] leading-none"
                style={{ color: isActive ? activeColor : inactiveColor }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
