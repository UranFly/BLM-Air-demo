import type { Dock, Drone, Point, Task } from "../types";
import { distance } from "./geometry";

export type DroneMatch = {
  drone: Drone;
  score: number;
  eligible: boolean;
  reasons: string[];
  unavailableReasons: string[];
};

export type ResourceRecommendation = {
  recommendedDrone?: Drone;
  recommendedDock?: Dock;
  droneMatches: DroneMatch[];
  dockReasons: string[];
};

function getTaskReferencePoint(task: Task): Point {
  if (task.targetPoint) return task.targetPoint;
  if (task.endPoint) return task.endPoint;
  if (task.targetAreaId === "area-a") return { x: 285, y: 205 };
  return { x: 500, y: 350 };
}

function getRequiredBattery(task: Task): number {
  if (task.type === "delivery") return 60;
  if (task.type === "emergency") return 40;
  return 50;
}

function getPayloadLabel(payload: string): string {
  const labels: Record<string, string> = {
    hd_camera: "高清相机",
    thermal: "热成像",
    speaker: "喊话器",
    delivery_box: "配送箱"
  };
  return labels[payload] ?? payload;
}

function evaluateDrone(task: Task, drone: Drone): DroneMatch {
  const referencePoint = getTaskReferencePoint(task);
  const requiredBattery = getRequiredBattery(task);
  const distanceScore = Math.max(0, 120 - distance(drone.position, referencePoint) / 5);
  const reasons: string[] = [];
  const unavailableReasons: string[] = [];
  let score = distanceScore;

  if (drone.status === "available") {
    score += 40;
    reasons.push("当前状态可用");
  } else {
    unavailableReasons.push(`${drone.status === "charging" ? "充电中" : drone.status === "executing" ? "执行中" : "离线"}`);
  }

  if (drone.battery >= requiredBattery) {
    score += 25;
    reasons.push(`电量 ${drone.battery}% 满足任务阈值`);
  } else {
    unavailableReasons.push(`电量 ${drone.battery}% 低于 ${requiredBattery}% 阈值`);
  }

  const missingPayloads = task.requiredPayloads.filter((payload) => !drone.payloads.includes(payload as Drone["payloads"][number]));
  if (missingPayloads.length === 0) {
    score += 25;
    reasons.push(`载荷匹配：${task.requiredPayloads.map(getPayloadLabel).join("、")}`);
  } else {
    unavailableReasons.push(`缺少载荷：${missingPayloads.map(getPayloadLabel).join("、")}`);
  }

  if (drone.recommendedFor.includes(task.type)) {
    score += 20;
    reasons.push(`适合${task.type === "inspection" ? "巡检" : task.type === "emergency" ? "应急" : "配送"}任务`);
  } else {
    unavailableReasons.push("任务类型适配度不足");
  }

  reasons.push(`距任务参考点约 ${Math.round(distance(drone.position, referencePoint))} 个模拟坐标单位`);

  return {
    drone,
    score,
    eligible: unavailableReasons.length === 0,
    reasons,
    unavailableReasons
  };
}

function findDockForDrone(drone: Drone | undefined, docks: Dock[]): { dock?: Dock; reasons: string[] } {
  if (!drone) return { reasons: ["尚未选定无人机"] };

  const homeDock = docks.find((dock) => dock.id === drone.homeDockId);
  if (!homeDock) {
    return { reasons: ["未找到无人机所属起降点"] };
  }

  const reasons = [`${homeDock.name} 是 ${drone.name} 的所属起降点`];
  if (homeDock.status === "available") {
    reasons.push("起降点当前可用");
    reasons.push("支持该无人机起降与补能");
    return { dock: homeDock, reasons };
  }

  const fallbackDock = docks.find((dock) => dock.status === "available" && dock.supportedDroneIds.includes(drone.id));
  if (fallbackDock) {
    return {
      dock: fallbackDock,
      reasons: [`${homeDock.name} 当前${homeDock.status === "maintenance" ? "维护中" : "忙碌中"}`, `${fallbackDock.name} 可作为备用起降点`]
    };
  }

  return {
    dock: homeDock,
    reasons: [...reasons, `${homeDock.name} 当前${homeDock.status === "maintenance" ? "维护中" : "忙碌中"}，需要调度员确认`]
  };
}

export function recommendResources(task: Task, drones: Drone[], docks: Dock[]): ResourceRecommendation {
  const droneMatches = drones
    .map((drone) => evaluateDrone(task, drone))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });
  const recommendedDrone = droneMatches.find((match) => match.eligible)?.drone;
  const dockResult = findDockForDrone(recommendedDrone, docks);

  return {
    recommendedDrone,
    recommendedDock: dockResult.dock,
    droneMatches,
    dockReasons: dockResult.reasons
  };
}
