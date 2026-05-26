/**
 * 关系更新节点
 * 
 * 根据意图分析结果更新关系状态，
 * 并决定是否触发阶段变化。
 */

import type { AgentStateType } from "../state";

/**
 * 更新关系状态并判断阶段跃迁
 */
export async function updateRelationshipNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const newFamiliarity = Math.min(100, state.familiarity + state.familiarityDelta);
  const newChemistry = Math.min(100, state.chemistry + state.chemistryDelta);

  // 判断关系阶段
  let newStage: string;
  if (newFamiliarity >= 70) {
    newStage = "暧昧";
  } else if (newFamiliarity >= 35) {
    newStage = "熟络";
  } else {
    newStage = "陌生";
  }

  // 检测阶段跃迁（可用于触发特殊事件）
  const stageChanged = newStage !== state.relationshipStage;

  // 生成关系记忆（阶段变化时记录）
  const newMemories: Array<{ type: string; content: string; importance: number }> = [];
  if (stageChanged) {
    newMemories.push({
      type: "event",
      content: `关系从"${state.relationshipStage}"升级到了"${newStage}"`,
      importance: 0.9,
    });
  }

  return {
    familiarity: newFamiliarity,
    chemistry: newChemistry,
    relationshipStage: newStage,
    newMemories,
  };
}
