"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { MomentPost } from "@/types";
import { getCharacter } from "@/lib/characters";
import Avatar from "./Avatar";
import { USER_AVATAR, QQ_BLUE, QQ_BG } from "@/lib/constants";
import { loadLastMomentsFilter, saveLastMomentsFilter } from "@/lib/memory";

const MAX_COMMENT_LENGTH = 40;

export default function MomentsFeed({ posts, onToggleLike, onAddComment }: {
  posts: MomentPost[];
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}) {
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [filterMode, setFilterMode] = useState<"all" | "highlighted" | "warm">(() => loadLastMomentsFilter());
  const highlightedPosts = posts.filter(post => post.interestContext).length;
  const warmPosts = posts.filter(post => post.relationshipStage && post.relationshipStage !== "陌生").length;
  const filterTabs = [
    { key: "all", label: "全部动态" },
    { key: "highlighted", label: "懂你优先" },
    { key: "warm", label: "关系升温" },
  ] as const;

  useEffect(() => {
    saveLastMomentsFilter(filterMode);
  }, [filterMode]);

  const filteredPosts = useMemo(() => {
    if (filterMode === "highlighted") {
      return posts.filter((post) => Boolean(post.interestContext));
    }

    if (filterMode === "warm") {
      return posts.filter((post) => post.relationshipStage && post.relationshipStage !== "陌生");
    }

    return posts;
  }, [filterMode, posts]);

  const filterSummary =
    filterMode === "highlighted"
      ? `已筛出 ${filteredPosts.length} 条更懂你的动态，适合先讲“为什么会推给你看”`
      : filterMode === "warm"
        ? `已筛出 ${filteredPosts.length} 条关系正在升温的动态，适合直接衔接关系变化`
        : `当前共展示 ${filteredPosts.length} 条动态，可按兴趣命中或关系变化快速切换讲述重点`;
  const filterHint =
    filterMode === "all"
      ? "点按筛选标签，可快速切到“兴趣命中”或“关系升温”两条演示路线"
      : filterMode === "highlighted"
        ? "当前更适合先解释兴趣命中原因，再展开点赞、评论或角色日常；再点一次当前标签即可取消"
        : "当前更适合先讲关系如何升温，再回到聊天页承接剧情推进；再点一次当前标签即可取消";
  const emptyFilterGuidance =
    filterMode === "highlighted"
      ? "说明当前还没有被你的兴趣标签命中的动态，先去聊天推进或切回“全部动态”更容易继续讲述。"
      : "说明当前关系还没推进到更亲近阶段，可以先回聊天页推进剧情，再回来观察空间变化。";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: QQ_BG }}>
      {/* QQ空间 Header */}
      <div className="relative overflow-hidden" style={{ height: 180, background: "linear-gradient(135deg, #12b7f5, #0099e5, #007bbd)" }}>
        <div className="absolute inset-0 flex items-end pb-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-[50px] h-[50px] rounded-lg overflow-hidden border-2 border-white/40">
              <Image src={USER_AVATAR} alt="我" width={50} height={50} className="object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold text-[16px]">我</p>
              <p className="text-white/70 text-[12px]">旁观者</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-5 relative z-10 mb-3">
        <div className="rounded-2xl px-4 py-3 text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, rgba(7,114,209,0.92), rgba(18,183,245,0.92))" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium">今日空间流</p>
              <p className="text-[11px] text-white/75 mt-1">根据剧情进展与你的兴趣偏好，已为你点亮 {highlightedPosts} 条更可能停留的动态</p>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-semibold leading-none">{posts.length}</div>
              <div className="text-[10px] text-white/70 mt-1">可见动态</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white/85">关系线索已注入</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white/85">天气关怀会影响日常感</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/15 text-white/85">关系升温 {warmPosts} 条</span>
          </div>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto">
            {filterTabs.map((tab) => {
              const isActive = filterMode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterMode(isActive ? "all" : tab.key)}
                  className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] leading-none transition-colors"
                  style={{
                    background: isActive ? `${QQ_BLUE}14` : "#f5f7fb",
                    color: isActive ? QQ_BLUE : "#8b98a8",
                  }}
                  aria-pressed={isActive}
                  title={isActive ? `取消${tab.label}筛选` : `切换到${tab.label}`}
                >
                  {tab.label}
                </button>
              );
            })}
            {filterMode !== "all" && (
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-[12px] leading-none text-[#8b98a8] bg-[#eef2f6]"
                aria-label="恢复动态页默认筛选"
                title="切回全部动态，回到最稳妥的演示主视图"
              >
                恢复默认
              </button>
            )}
          </div>
          <p className="mt-3 text-[12px] text-[#8fa2b8]" aria-live="polite">
            {filterSummary}
          </p>
          <p className="mt-1 text-[11px] text-[#b0bcc8]" aria-live="polite">
            {filterHint}
          </p>
          {filterMode !== "all" && (
            <p className="mt-1 text-[11px]" style={{ color: QQ_BLUE }} aria-live="polite">
              当前正在使用“{filterTabs.find((tab) => tab.key === filterMode)?.label}”视图；如果只想回到最容易讲述的主路线，直接点“恢复默认”即可。
            </p>
          )}
          <div className="mt-3 rounded-xl border border-[#edf3f8] bg-[#fafcff] px-3 py-2">
            <p className="text-[11px] font-medium text-[#5f7388]">演示讲法建议</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8fa2b8]">
              全部动态适合总览角色日常；“懂你优先”适合强调兴趣命中与推荐理由；“关系升温”适合快速展示聊天如何反馈到空间动态。
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#a7b4c2]">
              如果是在录屏或答辩中首次打开本页，建议先讲“全部动态”的整体变化，再按需切到更聚焦的筛选视图。
            </p>
          </div>
        </div>
      </div>

      {/* 动态列表 */}
      <div className="px-0">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-[#bbb] text-[14px]">
            还没有动态<br/>
            <span className="text-[12px]">先和 TA 们聊几句、点个赞或推进剧情，空间流就会逐渐热闹起来</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center text-[#9aa7b5] text-[14px] px-6">
            当前筛选下还没有匹配的动态
            <div className="mt-2 text-[12px] text-[#b4bec8]">{emptyFilterGuidance}</div>
            <div className="mt-2 text-[12px] text-[#c0cad4]">如果在录屏或答辩中卡住，优先切回“全部动态”继续展示会更稳妥。</div>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className="mt-4 rounded-full px-4 py-2 text-[12px]"
              style={{ background: `${QQ_BLUE}10`, color: QQ_BLUE }}
            >
              查看全部动态
            </button>
          </div>
        ) : (
          filteredPosts.map(post => {
            const char = getCharacter(post.characterId);
            const currentDraft = commentDrafts[post.id] || "";
            const trimmedDraft = currentDraft.trim();
            const remainingCharacters = MAX_COMMENT_LENGTH - currentDraft.length;
            const hasDraft = currentDraft.length > 0;
            if (!char) return null;
            return (
              <div key={post.id} className="bg-white px-4 py-4 mb-2">
                {/* 头部 */}
                <div className="flex items-start gap-3 mb-2">
                  <Avatar src={char.avatarImg} alt={char.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-medium" style={{ color: QQ_BLUE }}>{char.name}</span>
                      {post.interestContext && (
                        <span className="text-[10px] px-2 py-1 rounded-full leading-none"
                          style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}>
                          懂你 · {post.interestContext.topicTag}
                        </span>
                      )}
                      {post.relationshipStage && (
                        <span className="text-[10px] px-2 py-1 rounded-full leading-none bg-[#fff3f7] text-[#d9778f]">
                          {post.relationshipStage}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-[#333] mt-1 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                    {post.imageEmoji && (
                      <div className="mt-2 w-[160px] h-[120px] rounded-lg flex items-center justify-center text-[48px]"
                        style={{ background: "#f5f5f5" }}>
                        {post.imageEmoji}
                      </div>
                    )}
                    {post.interestContext && (
                      <div className="mt-2 rounded-xl px-3 py-2" style={{ background: `${QQ_BLUE}08`, border: `1px solid ${QQ_BLUE}18` }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[12px] font-medium" style={{ color: QQ_BLUE }}>
                            今日热点 · {post.interestContext.topicTitle}
                          </span>
                          <span className="text-[10px] text-[#91a0b1]">兴趣注入</span>
                        </div>
                        <p className="text-[12px] text-[#5f6b7a] leading-relaxed">{post.interestContext.topicBrief}</p>
                        <p className="text-[11px] text-[#91a0b1] mt-1">{post.interestContext.reason}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white text-[#7d91a8]">更可能停留</span>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-white text-[#7d91a8]">适合当下阶段</span>
                          {post.recommendationTags?.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-white text-[#7d91a8]">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!post.interestContext && post.recommendationTags?.length ? (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {post.recommendationTags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-[#f5f7fb] text-[#8b98a8]">{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {/* 时间+操作 */}
                <div className="flex items-center justify-between ml-[52px]">
                  <span className="text-[12px] text-[#bbb]">{post.time}</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => onToggleLike(post.id)}
                      className="flex items-center gap-1 text-[12px]"
                      style={{ color: post.likedByUser ? "#f43f5e" : "#999" }}>
                      {post.likedByUser ? "❤️" : "🤍"} {post.likes + (post.likedByUser ? 1 : 0)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommentingId(commentingId === post.id ? null : post.id)}
                      className="text-[12px]"
                      style={{ color: hasDraft && commentingId !== post.id ? QQ_BLUE : "#999" }}
                      aria-label={commentingId === post.id ? `收起${char.name}的评论输入框` : hasDraft ? `继续编辑给${char.name}的评论草稿` : `评论${char.name}的动态`}
                      title={commentingId === post.id ? "收起评论框" : hasDraft ? "继续编辑已暂存草稿" : "发表评论"}
                    >
                      💬 {post.comments.length}
                    </button>
                  </div>
                </div>
                {/* 评论区 */}
                {post.comments.length > 0 && (
                  <div className="ml-[52px] mt-2 px-3 py-2 rounded" style={{ background: "#f5f5f5" }}>
                    {post.comments.map(c => (
                      <div key={c.id} className="text-[13px] leading-relaxed">
                        <span className="font-medium" style={{ color: QQ_BLUE }}>{c.name}</span>
                        <span className="text-[#333]">：{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {commentingId !== post.id && hasDraft && (
                  <div
                    className="ml-[52px] mt-2 rounded-xl px-3 py-2"
                    style={{ background: `${QQ_BLUE}08`, border: `1px solid ${QQ_BLUE}18` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium" style={{ color: QQ_BLUE }}>已暂存评论草稿</p>
                        <p className="mt-1 text-[11px] text-[#7f93a8] truncate">{currentDraft}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCommentingId(post.id)}
                        className="flex-shrink-0 rounded-full px-3 py-1 text-[11px]"
                        style={{ background: `${QQ_BLUE}12`, color: QQ_BLUE }}
                      >
                        继续编辑
                      </button>
                    </div>
                  </div>
                )}
                {/* 评论输入 */}
                <AnimatePresence>
                  {commentingId === post.id && (
                    <motion.div className="ml-[52px] mt-2"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <div className="flex gap-2">
                        <input type="text" value={currentDraft} onChange={e => setCommentDrafts(prev => ({
                          ...prev,
                          [post.id]: e.target.value.slice(0, MAX_COMMENT_LENGTH),
                        }))}
                          onKeyDown={e => {
                            if (e.key === "Enter" && trimmedDraft) {
                              onAddComment(post.id, trimmedDraft);
                              setCommentDrafts(prev => ({ ...prev, [post.id]: "" }));
                              setCommentingId(null);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setCommentingId(null);
                            }
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded text-[13px] bg-white border border-[#e0e0e0] outline-none"
                          placeholder="说点什么..." autoFocus />
                        <button onClick={() => {
                          if (trimmedDraft) {
                            onAddComment(post.id, trimmedDraft);
                            setCommentDrafts(prev => ({ ...prev, [post.id]: "" }));
                            setCommentingId(null);
                          }
                        }}
                          disabled={!trimmedDraft}
                          className="px-3 py-1.5 rounded text-[13px] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: QQ_BLUE }}>发送</button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setCommentingId(null)}
                          className="text-[11px] text-[#9aa7b5]"
                        >
                          取消评论
                        </button>
                        <span className={`text-[11px] ${remainingCharacters <= 8 ? "text-[#f59e0b]" : "text-[#b0bcc8]"}`}>
                          还可输入 {remainingCharacters} 字 · 按 Esc 收起
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}