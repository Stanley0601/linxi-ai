"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { MomentPost } from "@/types";
import { getCharacter } from "@/lib/characters";
import Avatar from "./Avatar";
import { USER_AVATAR, QQ_BLUE, QQ_BG } from "@/lib/constants";

const MAX_COMMENT_LENGTH = 40;

export default function MomentsFeed({ posts, onToggleLike, onAddComment }: {
  posts: MomentPost[];
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
}) {
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: QQ_BG }}>
      {/* 顶部 Header */}
      <div className="relative overflow-hidden" style={{ height: 180, background: "linear-gradient(135deg, #12b7f5, #0099e5, #007bbd)" }}>
        <div className="absolute inset-0 flex items-end pb-4 px-4">
          <div className="flex items-center gap-3">
            <div className="w-[50px] h-[50px] rounded-lg overflow-hidden border-2 border-white/40">
              <Image src={USER_AVATAR} alt="我" width={50} height={50} className="object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold text-[16px]">我的动态</p>
              <p className="text-white/70 text-[12px]">{posts.length} 条好友动态</p>
            </div>
          </div>
        </div>
      </div>

      {/* 动态列表 */}
      <div className="px-0 mt-3">
        {posts.length === 0 ? (
          <div className="py-20 text-center text-[#bbb] text-[14px]">
            还没有动态<br/>
            <span className="text-[12px]">先和 TA 们聊几句，动态就会逐渐热闹起来</span>
          </div>
        ) : (
          posts.map(post => {
            const char = getCharacter(post.characterId);
            const currentDraft = commentDrafts[post.id] || "";
            const trimmedDraft = currentDraft.trim();
            const remainingCharacters = MAX_COMMENT_LENGTH - currentDraft.length;
            if (!char) return null;
            return (
              <div key={post.id} className="bg-white px-4 py-4 mb-2">
                {/* 头部 */}
                <div className="flex items-start gap-3 mb-2">
                  <Avatar src={char.avatarImg} alt={char.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium" style={{ color: QQ_BLUE }}>{char.name}</span>
                    </div>
                    <p className="text-[14px] text-[#333] mt-1.5 leading-relaxed whitespace-pre-wrap">{post.text}</p>

                    {/* 动态配图 —— 优先使用真实图片，fallback 到 emoji */}
                    {post.imageUrl ? (
                      <div className="mt-2 rounded-lg overflow-hidden" style={{ maxWidth: 220 }}>
                        <Image
                          src={post.imageUrl}
                          alt="动态配图"
                          width={220}
                          height={165}
                          className="object-cover w-full"
                        />
                      </div>
                    ) : post.imageEmoji ? (
                      <div className="mt-2 w-[160px] h-[120px] rounded-lg flex items-center justify-center text-[48px]"
                        style={{ background: "#f5f5f5" }}>
                        {post.imageEmoji}
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
                      className="text-[12px] text-[#999]"
                    >
                      💬 {post.comments.length}
                    </button>
                  </div>
                </div>

                {/* 评论列表 */}
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
                          className="px-3 py-1.5 rounded text-[13px] text-white disabled:opacity-40"
                          style={{ background: QQ_BLUE }}>发送</button>
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <button type="button" onClick={() => setCommentingId(null)} className="text-[11px] text-[#bbb]">取消</button>
                        <span className={`text-[11px] ${remainingCharacters <= 8 ? "text-[#f59e0b]" : "text-[#ccc]"}`}>
                          {remainingCharacters}
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
