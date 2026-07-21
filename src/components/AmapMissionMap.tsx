import { useEffect, useRef, useState } from "react";
import { MapCanvas } from "./MapCanvas";
import { airspaceZones, areas, docks, drones, obstacles, riskZones } from "../data/mockData";
import {
  xinglongCorridor,
  xinglongMapCenter,
  xinglongResourceMarkers,
  xinglongRiskPolygons,
  xinglongSemanticPolygons,
  type AmapSemanticPolygon,
  type LngLat
} from "../data/xinglongAmapLayers";
import type { DemoState, Point, Route } from "../types";

declare global {
  interface Window {
    AMap?: AmapApi;
  }
}

type AmapApi = {
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AmapMap;
  Polygon: new (options: Record<string, unknown>) => AmapOverlay;
  Polyline: new (options: Record<string, unknown>) => AmapOverlay;
  Marker: new (options: Record<string, unknown>) => AmapOverlay;
  Text: new (options: Record<string, unknown>) => AmapOverlay;
  Pixel: new (x: number, y: number) => unknown;
};

type AmapMap = {
  add: (overlay: AmapOverlay | AmapOverlay[]) => void;
  destroy: () => void;
};

type AmapOverlay = {
  setMap: (map: AmapMap | null) => void;
};

type AmapMissionMapProps = {
  state: DemoState;
  title: string;
  routes?: Route[];
  selectedRouteId?: string;
  activeDronePosition?: Point;
  temporaryControlActive?: boolean;
  mode: "resources" | "routes" | "risks" | "execution";
};

let amapMissionPromise: Promise<AmapApi> | null = null;

function loadAmap() {
  if (window.AMap) return Promise.resolve(window.AMap);
  if (amapMissionPromise) return amapMissionPromise;

  amapMissionPromise = new Promise<AmapApi>((resolve, reject) => {
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (window.AMap) {
        window.clearInterval(timer);
        resolve(window.AMap);
        return;
      }
      attempts += 1;
      if (attempts >= 120) {
        window.clearInterval(timer);
        reject(new Error("高德地图加载超时"));
      }
    }, 100);
  });

  return amapMissionPromise;
}

function pointToLngLat(point: Point): LngLat {
  const lngMin = 104.0602;
  const lngMax = 104.1072;
  const latMin = 30.3772;
  const latMax = 30.4072;
  return [lngMin + (point.x / 1000) * (lngMax - lngMin), latMax - (point.y / 700) * (latMax - latMin)];
}

function polygonCenter(path: LngLat[]): LngLat {
  const sums = path.reduce(
    (total, point) => {
      total[0] += point[0];
      total[1] += point[1];
      return total;
    },
    [0, 0] as LngLat
  );
  return [sums[0] / path.length, sums[1] / path.length];
}

function getSemanticCenter(item: AmapSemanticPolygon) {
  return polygonCenter(item.path);
}

function getRouteColor(route: Route, selectedRouteId?: string) {
  if (route.id === selectedRouteId) return "#22d3ee";
  if (route.type === "shortest") return "#f59e0b";
  if (route.type === "backup" || route.type === "replanned") return "#a78bfa";
  return "#94a3b8";
}

function createDronePortMarker(name: string) {
  const shortName = name.replace("无人机起降点", "");
  return `
    <div class="amap-drone-port amap-drone-port--mission" title="${name}">
      <div class="amap-drone-port__halo"></div>
      <div class="amap-drone-port__pad">
        <span class="amap-drone-port__arm amap-drone-port__arm--x"></span>
        <span class="amap-drone-port__arm amap-drone-port__arm--y"></span>
        <span class="amap-drone-port__body"></span>
        <span class="amap-drone-port__rotor amap-drone-port__rotor--one"></span>
        <span class="amap-drone-port__rotor amap-drone-port__rotor--two"></span>
        <span class="amap-drone-port__rotor amap-drone-port__rotor--three"></span>
        <span class="amap-drone-port__rotor amap-drone-port__rotor--four"></span>
      </div>
      <div class="amap-drone-port__label">${shortName}号起降资源</div>
    </div>
  `;
}

function createMissionDroneMarker(name: string, active = false) {
  return `
    <div class="amap-mission-drone ${active ? "is-active" : ""}" title="${name}">
      <span class="amap-mission-drone__wing amap-mission-drone__wing--x"></span>
      <span class="amap-mission-drone__wing amap-mission-drone__wing--y"></span>
      <span class="amap-mission-drone__body"></span>
      <span class="amap-mission-drone__label">${name}</span>
    </div>
  `;
}

function getModeCaption(mode: AmapMissionMapProps["mode"]) {
  const labels = {
    resources: "高德底图 · 起降资源与无人机调度",
    routes: "高德底图 · 候选航线规划",
    risks: "高德底图 · 风险推演与空域约束",
    execution: "高德底图 · 执行态势与动态重规划"
  };
  return labels[mode];
}

export function AmapMissionMap({ state, title, routes = state.routes, selectedRouteId = state.selectedRouteId, activeDronePosition, temporaryControlActive = false, mode }: AmapMissionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AmapMap | null>(null);
  const overlayRef = useRef<AmapOverlay[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadAmap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;
        const map = new AMap.Map(containerRef.current, {
          center: xinglongMapCenter,
          zoom: 13.9,
          viewMode: "2D",
          mapStyle: "amap://styles/darkblue",
          resizeEnable: true
        });
        mapRef.current = map;
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("failed");
      });

    return () => {
      cancelled = true;
      overlayRef.current.forEach((overlay) => overlay.setMap(null));
      overlayRef.current = [];
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || loadState !== "ready" || !window.AMap) return;
    const AMap = window.AMap;
    overlayRef.current.forEach((overlay) => overlay.setMap(null));
    const overlays: AmapOverlay[] = [];

    if (state.enabledLayers.spatial) {
      xinglongSemanticPolygons.forEach((item) => {
        overlays.push(
          new AMap.Polygon({
            path: item.path,
            fillColor: item.fillColor,
            fillOpacity: item.id === "water" ? 0.08 : 0.14,
            strokeColor: item.fillColor,
            strokeOpacity: 0.62,
            strokeWeight: 2,
            zIndex: 8
          }),
          new AMap.Text({
            text: item.label,
            position: getSemanticCenter(item),
            anchor: "center",
            style: {
              padding: "4px 8px",
              color: "#e5faff",
              border: `1px solid ${item.fillColor}`,
              background: "rgba(3,10,20,.72)",
              fontSize: "12px",
              whiteSpace: "nowrap"
            },
            zIndex: 30
          })
        );
      });
    }

    if (state.enabledLayers.airspace || mode === "routes" || mode === "execution") {
      overlays.push(
        new AMap.Polyline({
          path: xinglongCorridor,
          strokeColor: "#e5faff",
          strokeOpacity: 0.45,
          strokeWeight: 6,
          strokeStyle: "dashed",
          zIndex: 18
        })
      );
    }

    if (state.enabledLayers.risks || mode === "risks" || temporaryControlActive) {
      xinglongRiskPolygons.forEach((risk) => {
        overlays.push(
          new AMap.Polygon({
            path: risk.path,
            fillColor: risk.fillColor,
            fillOpacity: 0.14,
            strokeColor: risk.fillColor,
            strokeOpacity: 0.82,
            strokeWeight: 2,
            strokeStyle: "dashed",
            zIndex: 20
          }),
          new AMap.Text({
            text: risk.label,
            position: polygonCenter(risk.path),
            anchor: "center",
            style: {
              padding: "4px 8px",
              color: "#fff7ed",
              border: `1px solid ${risk.fillColor}`,
              background: "rgba(20,8,4,.76)",
              fontSize: "12px",
              whiteSpace: "nowrap"
            },
            zIndex: 31
          })
        );
      });
    }

    if (temporaryControlActive) {
      const controlZone = airspaceZones.find((zone) => zone.id === "temporary-control");
      if (controlZone) {
        overlays.push(
          new AMap.Polygon({
            path: controlZone.polygon.map(pointToLngLat),
            fillColor: "#ef4444",
            fillOpacity: 0.22,
            strokeColor: "#ef4444",
            strokeOpacity: 0.92,
            strokeWeight: 3,
            strokeStyle: "dashed",
            zIndex: 28
          }),
          new AMap.Text({
            text: "临时管制",
            position: polygonCenter(controlZone.polygon.map(pointToLngLat)),
            anchor: "center",
            style: {
              padding: "5px 9px",
              color: "#fff1f2",
              border: "1px solid rgba(239,68,68,.82)",
              background: "rgba(69,10,10,.82)",
              fontSize: "12px",
              fontWeight: "700"
            },
            zIndex: 36
          })
        );
      }
    }

    if (state.enabledLayers.resources || mode === "resources") {
      xinglongResourceMarkers.forEach((resource) => {
        overlays.push(
          new AMap.Marker({
            position: resource.position,
            title: resource.name,
            content: createDronePortMarker(resource.name),
            anchor: "center",
            zIndex: 42
          })
        );
      });

      drones.forEach((drone, index) => {
        const homeResource = xinglongResourceMarkers.find((resource) => resource.id === drone.homeDockId) ?? xinglongResourceMarkers[0];
        const offset: LngLat = [homeResource.position[0] + (index % 2 === 0 ? 0.0011 : -0.0011), homeResource.position[1] + (index < 2 ? -0.001 : 0.001)];
        overlays.push(
          new AMap.Marker({
            position: offset,
            title: drone.name,
            content: createMissionDroneMarker(drone.name),
            anchor: "center",
            zIndex: 44
          })
        );
      });
    }

    routes.forEach((route) => {
      const routeColor = getRouteColor(route, selectedRouteId);
      overlays.push(
        new AMap.Polyline({
          path: route.waypoints.map(pointToLngLat),
          strokeColor: routeColor,
          strokeOpacity: route.id === selectedRouteId ? 0.92 : 0.45,
          strokeWeight: route.id === selectedRouteId ? 6 : 4,
          strokeStyle: route.type === "recommended" ? "solid" : "dashed",
          zIndex: route.id === selectedRouteId ? 34 : 26
        })
      );
    });

    if (state.activeTask?.targetPoint && state.enabledLayers.tasks) {
      overlays.push(
        new AMap.Marker({
          position: pointToLngLat(state.activeTask.targetPoint),
          title: "任务点",
          content: '<div class="amap-task-target">任务点</div>',
          anchor: "center",
          zIndex: 48
        })
      );
    }

    if (activeDronePosition) {
      overlays.push(
        new AMap.Marker({
          position: pointToLngLat(activeDronePosition),
          title: "执行中无人机",
          content: createMissionDroneMarker("执行中", true),
          anchor: "center",
          zIndex: 56
        })
      );
    }

    mapRef.current.add(overlays);
    overlayRef.current = overlays;
  }, [activeDronePosition, loadState, mode, routes, selectedRouteId, state.activeTask, state.enabledLayers, temporaryControlActive]);

  if (loadState === "failed") {
    return (
      <div className="amap-fallback-frame">
        <MapCanvas
          areas={areas}
          airspaceZones={airspaceZones}
          obstacles={obstacles}
          riskZones={riskZones}
          docks={docks}
          drones={drones}
          routes={routes}
          selectedRouteId={selectedRouteId}
          activeTask={state.activeTask}
          activeDronePosition={activeDronePosition}
          enabledLayers={state.enabledLayers}
          temporaryControlActive={temporaryControlActive}
        />
        <div className="amap-fallback-note">
          <strong>高德深色底图暂未加载</strong>
          <span>当前页面已临时显示本地模拟地图；请检查高德 Key、安全密钥和来源白名单。</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`amap-mission-shell amap-mission-shell--${mode}`}>
      <div ref={containerRef} className="amap-mission-container" />
      {loadState === "loading" && <div className="amap-loading">正在加载高德深色底图...</div>}
      <div className="amap-mission-hud">
        <strong>{title}</strong>
        <span>{getModeCaption(mode)}</span>
      </div>
      <div className="amap-caption-bar">高德深色底图 · 成都兴隆湖 · 任务流程地图</div>
    </div>
  );
}
