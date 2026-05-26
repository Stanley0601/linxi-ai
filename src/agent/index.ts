/**
 * 灵犀 Agent 模块入口
 * 
 * 导出 Agent 的核心接口供 API Routes 使用
 */

export { getLinXiAgent, runLinXiAgent } from "./graph";
export type { ChatInput, ChatOutput } from "./graph";
export { AgentState } from "./state";
export type { AgentStateType } from "./state";
