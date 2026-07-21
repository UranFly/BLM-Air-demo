import type { Drone, RiskItem, Route, Task } from "../types";

export type RiskDecision = {
  level: "low" | "medium" | "high";
  verdict: "可执行" | "需人工确认" | "不建议执行";
  summary: string;
};

export function generateRiskItems(task: Task, route: Route, drone?: Drone): RiskItem[] {
  const baseId = `${task.id}-${route.id}`;

  if (route.type === "shortest") {
    return [
      {
        id: `${baseId}-airspace`,
        taskId: task.id,
        routeId: route.id,
        category: "airspace",
        level: "high",
        title: "空域风险",
        description: "最短路线可能穿越禁飞区甲，存在严重合规风险。",
        suggestion: "不建议执行该路线，请改选推荐路线或重新规划。",
        requiresHumanConfirm: true
      },
      {
        id: `${baseId}-obstacle`,
        taskId: task.id,
        routeId: route.id,
        category: "obstacle",
        level: "medium",
        title: "障碍物风险",
        description: "该路线接近城市核心区高层建筑群。",
        suggestion: "建议提升安全高度或绕开密集障碍区。",
        requiresHumanConfirm: true
      },
      {
        id: `${baseId}-compliance`,
        taskId: task.id,
        routeId: route.id,
        category: "compliance",
        level: "high",
        title: "合规风险",
        description: "路线穿越敏感区域，需要改线后再进入执行。",
        suggestion: "选择系统推荐路线，并重新进行风险推演。",
        requiresHumanConfirm: true
      }
    ];
  }

  const communicationLevel = route.type === "backup" ? "low" : "medium";
  const obstacleLevel = task.type === "delivery" ? "low" : "medium";

  return [
    {
      id: `${baseId}-airspace`,
      taskId: task.id,
      routeId: route.id,
      category: "airspace",
      level: "low",
      title: "空域风险",
      description: "当前路线已绕开禁飞区和主要限制空域。",
      suggestion: "保持空域图层开启，执行前完成调度确认。",
      requiresHumanConfirm: false
    },
    {
      id: `${baseId}-obstacle`,
      taskId: task.id,
      routeId: route.id,
      category: "obstacle",
      level: obstacleLevel,
      title: "障碍物风险",
      description: obstacleLevel === "medium" ? "部分航段靠近高层建筑群，需保持安全间隔。" : "路线避开主要障碍物密集区域。",
      suggestion: obstacleLevel === "medium" ? "建议保持安全高度并开启避障策略。" : "按当前规划执行。",
      requiresHumanConfirm: obstacleLevel === "medium"
    },
    {
      id: `${baseId}-weather`,
      taskId: task.id,
      routeId: route.id,
      category: "weather",
      level: "low",
      title: "天气风险",
      description: "模拟天气风险处于可控范围。",
      suggestion: "执行中持续监测风速和降水变化。",
      requiresHumanConfirm: false
    },
    {
      id: `${baseId}-communication`,
      taskId: task.id,
      routeId: route.id,
      category: "communication",
      level: communicationLevel,
      title: "通信风险",
      description: communicationLevel === "medium" ? "部分航段经过通信弱覆盖区。" : "备用路线避开主要通信弱覆盖区。",
      suggestion: communicationLevel === "medium" ? "建议启用关键帧回传和链路质量监测。" : "按常规链路策略执行。",
      requiresHumanConfirm: communicationLevel === "medium"
    },
    {
      id: `${baseId}-battery`,
      taskId: task.id,
      routeId: route.id,
      category: "battery",
      level: drone && drone.battery < 55 ? "medium" : "low",
      title: "电量风险",
      description: drone ? `${drone.name} 当前电量 ${drone.battery}%，满足当前路线的模拟执行需求。` : "未绑定无人机，无法完成电量复核。",
      suggestion: drone ? "执行中持续记录电量变化。" : "请先完成资源确认。",
      requiresHumanConfirm: !drone || drone.battery < 55
    },
    {
      id: `${baseId}-resource`,
      taskId: task.id,
      routeId: route.id,
      category: "resource",
      level: drone?.status === "available" ? "low" : "medium",
      title: "资源风险",
      description: drone?.status === "available" ? "推荐无人机处于可用状态。" : "无人机状态需要调度员复核。",
      suggestion: "执行前锁定无人机和起降点资源。",
      requiresHumanConfirm: drone?.status !== "available"
    },
    {
      id: `${baseId}-mission`,
      taskId: task.id,
      routeId: route.id,
      category: "mission",
      level: task.priority === "high" ? "medium" : "low",
      title: "任务风险",
      description: task.priority === "high" ? "应急任务对时效和现场不确定性更敏感。" : "任务优先级正常，执行窗口稳定。",
      suggestion: task.priority === "high" ? "建议开启高频状态回传。" : "按常规任务策略执行。",
      requiresHumanConfirm: task.priority === "high"
    },
    {
      id: `${baseId}-compliance`,
      taskId: task.id,
      routeId: route.id,
      category: "compliance",
      level: "medium",
      title: "合规风险",
      description: "低空任务执行前需要调度员确认模拟合规条件。",
      suggestion: "确认风险并进入执行仿真。",
      requiresHumanConfirm: true
    }
  ];
}

export function evaluateRiskDecision(items: RiskItem[]): RiskDecision {
  const hasSevereAirspaceRisk = items.some((item) => item.category === "airspace" && item.level === "high");
  const hasHighRisk = items.some((item) => item.level === "high");
  const needsConfirm = items.some((item) => item.requiresHumanConfirm || item.level === "medium");

  if (hasSevereAirspaceRisk) {
    return {
      level: "high",
      verdict: "不建议执行",
      summary: "存在严重空域风险，系统建议改选路线或重新规划。"
    };
  }

  if (hasHighRisk || needsConfirm) {
    return {
      level: "medium",
      verdict: "需人工确认",
      summary: "当前路线整体可控，但存在需要调度员复核的中等风险项。"
    };
  }

  return {
    level: "low",
    verdict: "可执行",
    summary: "当前路线风险较低，可以进入执行仿真。"
  };
}
