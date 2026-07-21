import type { Drone, DynamicEvent, MissionReport, RiskItem, Route, Task } from "../types";

function getKeyFindings(task: Task): string[] {
  if (task.type === "emergency") {
    return ["抵达突发事件点", "回传现场图像", "生成现场态势摘要", "记录动态风险事件"];
  }

  if (task.type === "delivery") {
    return ["完成起点至目标点配送", "记录配送轨迹", "完成交付确认", "记录异常事件"];
  }

  return ["完成目标区域巡检", "覆盖重点点位", "未发现高风险异常", "生成巡检报告"];
}

export function generateMissionReport(params: {
  task: Task;
  drone: Drone;
  route: Route;
  riskItems: RiskItem[];
  dynamicEvents: DynamicEvent[];
}): MissionReport {
  const { task, drone, route, riskItems, dynamicEvents } = params;
  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - route.estimatedTimeMin * 60 * 1000);
  const triggeredEvents = dynamicEvents.filter((event) => event.triggered);

  return {
    id: `report-${task.id}`,
    taskId: task.id,
    taskTitle: task.title,
    taskType: task.type,
    droneId: drone.id,
    routeId: route.id,
    summary: `${task.title} 已完成执行仿真，系统沉淀轨迹、风险、资源与结果数据。`,
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    flightDistanceKm: route.estimatedDistanceKm,
    flightTimeMin: route.estimatedTimeMin,
    keyFindings: getKeyFindings(task),
    riskEvents: [
      ...riskItems.filter((item) => item.level !== "low").map((item) => `${item.title}：${item.description}`),
      ...triggeredEvents.map((event) => `${event.title}：${event.description}`)
    ],
    deliverables: task.deliverables,
    dataAssets: [
      "空间数据：飞行轨迹、任务区域、风险区",
      "资源数据：无人机状态、电量变化、起降点记录",
      "风险数据：空域、通信、障碍物、合规检查项",
      "任务数据：任务意图、约束条件、执行状态流转",
      "结果数据：交付物、关键发现、任务报告"
    ]
  };
}

export function groupDataAssets(report: MissionReport): Record<string, string[]> {
  return report.dataAssets.reduce<Record<string, string[]>>((groups, asset) => {
    const [group, value] = asset.split("：");
    groups[group] = [...(groups[group] ?? []), value ?? asset];
    return groups;
  }, {});
}
