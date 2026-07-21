import { useEffect, useRef, useState } from "react";
import { MapCanvas } from "./MapCanvas";
import { airspaceZones, areas, docks, drones, obstacles, riskZones } from "../data/mockData";
import type { DemoState } from "../types";
import {
  xinglongCorridor,
  xinglongMapCenter,
  xinglongResourceMarkers,
  xinglongRiskPolygons,
  xinglongSemanticPolygons,
  type AmapSemanticPolygon
} from "../data/xinglongAmapLayers";

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string;
    };
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

type AmapWorldOverviewProps = {
  state: DemoState;
};

type AmapLayerKey = "water" | "inspection" | "emergency" | "delivery" | "core" | "corridor" | "risks" | "resources";

type LayerControl = {
  id: AmapLayerKey;
  label: string;
  description: string;
  color: string;
};

let amapPromise: Promise<AmapApi> | null = null;

function loadAmap() {
  if (window.AMap) return Promise.resolve(window.AMap);
  if (amapPromise) return amapPromise;

  amapPromise = new Promise<AmapApi>((resolve, reject) => {
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

  return amapPromise;
}

const layerControls: LayerControl[] = [
  ...xinglongSemanticPolygons.map((item) => ({
    id: item.id as AmapLayerKey,
    label: item.label,
    description: item.description,
    color: item.fillColor
  })),
  {
    id: "corridor",
    label: "低空通道",
    description: "对应湖岸之间可通行的飞行走廊，是航线规划优先使用的安全路径。",
    color: "#e5faff"
  },
  {
    id: "risks",
    label: "风险约束",
    description: "对应通信弱覆盖区和密集障碍区，用于推演绕飞、降速和人工确认。",
    color: "#ef4444"
  },
  {
    id: "resources",
    label: "起降资源",
    description: "对应地图上的起降点和无人机位置，用于调度可用资源。",
    color: "#22c55e"
  }
];

function createInitialVisibleLayers(): Record<AmapLayerKey, boolean> {
  return {
    water: true,
    inspection: true,
    emergency: true,
    delivery: true,
    core: true,
    corridor: true,
    risks: true,
    resources: true
  };
}

function createEmptyOverlayLayers(): Record<AmapLayerKey, AmapOverlay[]> {
  return {
    water: [],
    inspection: [],
    emergency: [],
    delivery: [],
    core: [],
    corridor: [],
    risks: [],
    resources: []
  };
}

function getPolygonCenter(item: AmapSemanticPolygon): [number, number] {
  const sums = item.path.reduce(
    (total, point) => {
      total[0] += point[0];
      total[1] += point[1];
      return total;
    },
    [0, 0] as [number, number]
  );
  return [sums[0] / item.path.length, sums[1] / item.path.length];
}

function createDronePortMarker(name: string) {
  const shortName = name.replace("无人机起降点", "");
  return `
    <div class="amap-drone-port" title="${name}">
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

export function AmapWorldOverview({ state }: AmapWorldOverviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AmapMap | null>(null);
  const overlayRef = useRef<Record<AmapLayerKey, AmapOverlay[]>>(createEmptyOverlayLayers());
  const [visibleLayers, setVisibleLayers] = useState<Record<AmapLayerKey, boolean>>(() => createInitialVisibleLayers());
  const [loadState, setLoadState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    loadAmap()
      .then((AMap) => {
        if (cancelled || !containerRef.current) return;
        const map = new AMap.Map(containerRef.current, {
          center: xinglongMapCenter,
          zoom: 13.95,
          viewMode: "2D",
          mapStyle: "amap://styles/darkblue",
          resizeEnable: true
        });

        const overlaysByLayer = createEmptyOverlayLayers();
        xinglongSemanticPolygons.forEach((item) => {
          overlaysByLayer[item.id as AmapLayerKey].push(
            new AMap.Polygon({
              path: item.path,
              fillColor: item.fillColor,
              fillOpacity: item.id === "water" ? 0.1 : 0.2,
              strokeColor: item.fillColor,
              strokeOpacity: 0.72,
              strokeWeight: 2,
              zIndex: item.id === "water" ? 8 : 12
            }),
            new AMap.Text({
              text: item.label,
              position: getPolygonCenter(item),
              anchor: "center",
              style: {
                padding: "5px 9px",
                color: "#e5faff",
                border: `1px solid ${item.fillColor}`,
                background: "rgba(3,10,20,.78)",
                fontSize: "12px",
                whiteSpace: "nowrap"
              },
              zIndex: 30
            })
          );
        });

        overlaysByLayer.corridor.push(
          new AMap.Polyline({
            path: xinglongCorridor,
            strokeColor: "#e5faff",
            strokeOpacity: 0.58,
            strokeWeight: 6,
            strokeStyle: "dashed",
            zIndex: 20
          }),
          new AMap.Text({
            text: "低空通道",
            position: xinglongCorridor[2],
            anchor: "center",
            offset: new AMap.Pixel(0, -18),
            style: {
              padding: "5px 9px",
              color: "#06111f",
              border: "1px solid rgba(229,250,255,.82)",
              background: "rgba(229,250,255,.82)",
              fontSize: "12px",
              fontWeight: "700"
            },
            zIndex: 32
          })
        );

        xinglongRiskPolygons.forEach((risk) => {
          overlaysByLayer.risks.push(
            new AMap.Polygon({
              path: risk.path,
              fillColor: risk.fillColor,
              fillOpacity: 0.16,
              strokeColor: risk.fillColor,
              strokeOpacity: 0.86,
              strokeWeight: 2,
              strokeStyle: "dashed",
              zIndex: 18
            }),
            new AMap.Text({
              text: risk.label,
              position: getPolygonCenter(risk),
              anchor: "center",
              style: {
                padding: "5px 9px",
                color: "#fff7ed",
                border: `1px solid ${risk.fillColor}`,
                background: "rgba(20,8,4,.78)",
                fontSize: "12px",
                whiteSpace: "nowrap"
              },
              zIndex: 31
            })
          );
        });

        xinglongResourceMarkers.forEach((resource) => {
          overlaysByLayer.resources.push(
            new AMap.Marker({
              position: resource.position,
              title: resource.name,
              content: createDronePortMarker(resource.name),
              anchor: "center",
              offset: new AMap.Pixel(0, 0),
              zIndex: 42
            })
          );
        });

        const activeOverlays = Object.entries(overlaysByLayer).flatMap(([key, overlays]) => (visibleLayers[key as AmapLayerKey] ? overlays : []));
        map.add(activeOverlays);
        mapRef.current = map;
        overlayRef.current = overlaysByLayer;
        setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("failed");
      });

    return () => {
      cancelled = true;
      Object.values(overlayRef.current).flat().forEach((overlay) => overlay.setMap(null));
      overlayRef.current = createEmptyOverlayLayers();
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || loadState !== "ready") return;
    layerControls.forEach((layer) => {
      overlayRef.current[layer.id]?.forEach((overlay) => overlay.setMap(visibleLayers[layer.id] ? mapRef.current : null));
    });
  }, [loadState, visibleLayers]);

  function toggleLayer(layerId: AmapLayerKey) {
    setVisibleLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  }

  const activeLayer = layerControls.find((layer) => visibleLayers[layer.id]);

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
          routes={state.routes}
          selectedRouteId={state.selectedRouteId}
          activeTask={state.activeTask}
          enabledLayers={state.enabledLayers}
        />
        <div className="amap-fallback-note">
          <strong>高德深色底图暂未加载</strong>
          <span>请检查高德网页端密钥、安全密钥和来源白名单；当前已临时显示本地模拟底图。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="amap-overview-shell">
      <div ref={containerRef} className="amap-overview-container" />
      {loadState === "loading" && <div className="amap-loading">正在加载高德深色底图...</div>}
      <div className="amap-layer-console" aria-label="语义图层开关">
        {layerControls.map((layer) => (
          <button key={layer.id} className={`amap-layer-button ${visibleLayers[layer.id] ? "is-on" : ""}`} type="button" onClick={() => toggleLayer(layer.id)}>
            <span className="amap-layer-swatch" style={{ backgroundColor: layer.color }} />
            <span>{layer.label}</span>
          </button>
        ))}
      </div>
      {activeLayer && (
        <div className="amap-semantic-note">
          <strong>当前语义</strong>
          <span>{activeLayer.description}</span>
        </div>
      )}
      <div className="amap-caption-bar">高德深色底图 · 成都兴隆湖 · 低空语义图层</div>
    </div>
  );
}
