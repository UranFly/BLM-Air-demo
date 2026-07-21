import type { Point, Route, Task } from "../types";
import { distance, pathDistance } from "./geometry";

function interpolate(a: Point, b: Point, ratio: number): Point {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio
  };
}

export function getPointAtProgress(route: Route, progress: number): Point {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const totalDistance = pathDistance(route.waypoints);
  const targetDistance = totalDistance * (clampedProgress / 100);
  let travelled = 0;

  for (let index = 1; index < route.waypoints.length; index += 1) {
    const previous = route.waypoints[index - 1];
    const current = route.waypoints[index];
    const segmentDistance = distance(previous, current);

    if (travelled + segmentDistance >= targetDistance) {
      return interpolate(previous, current, (targetDistance - travelled) / segmentDistance);
    }

    travelled += segmentDistance;
  }

  return route.waypoints[route.waypoints.length - 1] ?? { x: 0, y: 0 };
}

export function getCurrentWaypointIndex(route: Route, progress: number): number {
  return Math.min(route.waypoints.length, Math.max(1, Math.ceil((progress / 100) * route.waypoints.length)));
}

export function estimateBattery(initialBattery: number, progress: number, eventTriggered: boolean): number {
  const eventPenalty = eventTriggered ? 4 : 0;
  return Math.max(12, Math.round(initialBattery - progress * 0.22 - eventPenalty));
}

export function createReplannedRoute(task: Task, currentRoute: Route, currentPosition: Point): Route {
  const destination = currentRoute.waypoints[currentRoute.waypoints.length - 1] ?? currentPosition;
  const waypoints = [
    currentPosition,
    { x: Math.min(930, currentPosition.x + 130), y: Math.max(95, currentPosition.y - 110) },
    { x: Math.min(930, destination.x + 95), y: Math.max(90, destination.y - 125) },
    destination
  ];
  const distanceKm = Number((pathDistance(waypoints) / 62).toFixed(1));

  return {
    id: `${task.id}-route-replanned`,
    name: "重规划方案：东侧绕行航线",
    taskId: task.id,
    type: "replanned",
    waypoints,
    estimatedDistanceKm: distanceKm,
    estimatedTimeMin: Math.round(distanceKm * 2.8 + 5),
    riskScore: 26,
    recommendation: "recommended",
    reasons: ["绕开新出现的临时管制区", "预计增加少量飞行距离", "综合风险等级低，系统推荐采用"]
  };
}
