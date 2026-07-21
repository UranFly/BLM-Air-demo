import type { Dock, Route, Task } from "../types";
import { pathDistance } from "./geometry";

function getTaskDestination(task: Task) {
  if (task.targetPoint) return task.targetPoint;
  if (task.endPoint) return task.endPoint;
  if (task.targetAreaId === "area-a") return { x: 300, y: 205 };
  return { x: 500, y: 350 };
}

function toKm(points: Route["waypoints"]) {
  return Number((pathDistance(points) / 62).toFixed(1));
}

function toMinutes(distanceKm: number, riskScore: number) {
  return Math.round(distanceKm * 2.6 + riskScore / 8);
}

export function planRoutes(task: Task, dock: Dock): Route[] {
  const start = dock.position;
  const destination = getTaskDestination(task);
  const taskPrefix = task.type === "inspection" ? "巡检" : task.type === "emergency" ? "应急" : "配送";

  const shortestWaypoints = [
    start,
    { x: Math.round((start.x + destination.x) / 2), y: Math.round((start.y + destination.y) / 2) },
    destination
  ];

  const recommendedWaypoints = [
    start,
    { x: Math.max(130, start.x + 120), y: Math.max(90, start.y - 105) },
    { x: 455, y: 150 },
    { x: destination.x - 80, y: Math.max(115, destination.y - 70) },
    destination
  ];

  const backupWaypoints = [
    start,
    { x: Math.max(130, start.x + 60), y: Math.min(640, start.y + 120) },
    { x: 455, y: 615 },
    { x: Math.min(900, destination.x + 70), y: Math.min(640, destination.y + 80) },
    destination
  ];

  const shortestDistance = toKm(shortestWaypoints);
  const recommendedDistance = toKm(recommendedWaypoints);
  const backupDistance = toKm(backupWaypoints);

  return [
    {
      id: `${task.id}-route-shortest`,
      name: `方案甲：${taskPrefix}最短路线`,
      taskId: task.id,
      type: "shortest",
      waypoints: shortestWaypoints,
      estimatedDistanceKm: shortestDistance,
      estimatedTimeMin: toMinutes(shortestDistance, 78),
      riskScore: 78,
      recommendation: "not_recommended",
      reasons: ["距离最短", "可能穿越禁飞区或密集风险区", "用于展示约束校验能力，不建议执行"]
    },
    {
      id: `${task.id}-route-recommended`,
      name: `方案乙：${taskPrefix}推荐路线`,
      taskId: task.id,
      type: "recommended",
      waypoints: recommendedWaypoints,
      estimatedDistanceKm: recommendedDistance,
      estimatedTimeMin: toMinutes(recommendedDistance, 32),
      riskScore: 32,
      recommendation: "recommended",
      reasons: ["绕开禁飞区", "综合空域、障碍物、通信风险后评分最低", "适合作为本次任务执行路线"]
    },
    {
      id: `${task.id}-route-backup`,
      name: `方案丙：${taskPrefix}备用路线`,
      taskId: task.id,
      type: "backup",
      waypoints: backupWaypoints,
      estimatedDistanceKm: backupDistance,
      estimatedTimeMin: toMinutes(backupDistance, 48),
      riskScore: 48,
      recommendation: "backup",
      reasons: ["距离稍长", "绕行南侧风险走廊", "可用于通信异常或临时管制时切换"]
    }
  ];
}
