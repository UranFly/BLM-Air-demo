import type { Point } from "../types";

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pathDistance(points: Point[]): number {
  return points.slice(1).reduce((sum, point, index) => sum + distance(points[index], point), 0);
}

export function pointToString(point: Point): string {
  return `${Math.round(point.x)}, ${Math.round(point.y)}`;
}

export function getRouteMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  return points[Math.floor(points.length / 2)];
}
