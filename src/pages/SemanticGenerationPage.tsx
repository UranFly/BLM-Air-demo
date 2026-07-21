import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type PageProps = {
  goNext: () => void;
};

type GenerationStatus = "empty" | "generating" | "generated";

type GeneratedLayer = {
  id: string;
  name: string;
  source: string;
  confidence: number;
  color: string;
  description: string;
};

const generatedLayers: GeneratedLayer[] = [
  {
    id: "space",
    name: "三维空间结构",
    source: "卫星地图 + 视频多帧配准",
    confidence: 94,
    color: "#22d3ee",
    description: "重建湖岸、水域、道路、建筑、绿地和广场的空间边界，形成可计算的三维场景。"
  },
  {
    id: "airspace",
    name: "低空通行空间",
    source: "重建高度场 + 空域规则",
    confidence: 89,
    color: "#f59e0b",
    description: "根据建筑高度、水域边界和敏感区域生成可飞、限高、缓冲和禁飞空间。"
  },
  {
    id: "resources",
    name: "资源与落点网络",
    source: "起降点 + 飞行轨迹",
    confidence: 95,
    color: "#22c55e",
    description: "把起降点、候选落点、返航半径、载荷能力和通信覆盖组织成资源网络。"
  },
  {
    id: "risk",
    name: "动态风险环境",
    source: "视频识别 + 气象修正",
    confidence: 86,
    color: "#ef4444",
    description: "识别人群、车辆、临时施工、遮挡物、通信弱覆盖和气象扰动。"
  },
  {
    id: "task",
    name: "任务可理解对象",
    source: "兴趣点 + 视觉目标",
    confidence: 90,
    color: "#a78bfa",
    description: "把巡检对象、应急点、配送点和安全关注点转成可调度的任务语义。"
  }
];

const manualSemantics = ["临时起降区", "临时禁飞区", "人群聚集点", "应急通道", "重点巡检对象"];

const connectorCards = [
  ["卫星地图数据", "提供正射底图、水域边界、道路结构和建筑轮廓"],
  ["无人机航拍视频", "提供多视角细节、临时变化、遮挡关系和地面活动"],
  ["高德兴趣点数据", "提供园区、道路、服务点、公共设施和任务目标名称"],
  ["实时气象数据", "提供风速、风向、降雨、能见度和气象风险修正"]
];

const pipelineSteps = [
  ["视频抽帧", "从航拍视频提取稳定关键帧"],
  ["地图配准", "对齐卫星底图、水域边界和相机位姿"],
  ["世界重建", "恢复建筑、道路、水域、绿地和障碍物"],
  ["语义生成", "输出可查询、可推演、可渲染的世界模型"]
];

export function SemanticGenerationPage({ goNext }: PageProps) {
  const [status, setStatus] = useState<GenerationStatus>("empty");
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeLayers, setActiveLayers] = useState<Set<string>>(() => new Set());
  const [manualItems, setManualItems] = useState<string[]>(["临时起降区", "重点巡检对象"]);

  const generatedCount = activeLayers.size;
  const statusText = useMemo(() => {
    if (status === "empty") return "等待上传无人机飞行视频";
    if (status === "generating") return "正在重建物理世界";
    return "完整物理世界已重建";
  }, [status]);

  useEffect(() => {
    if (!videoUrl) return;
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  function runGeneration(fileName: string) {
    setStatus("generating");
    setActiveLayers(new Set());
    window.setTimeout(() => {
      setActiveLayers(new Set(generatedLayers.map((layer) => layer.id)));
      setStatus("generated");
      setVideoName(fileName);
    }, 900);
  }

  function handleVideoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setVideoName(file.name);
    runGeneration(file.name);
  }

  function toggleLayer(layerId: string) {
    if (status === "empty") return;
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }

  function toggleManualItem(item: string) {
    setManualItems((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  }

  return (
    <section className="page-grid page-grid--single">
      <div className="panel panel--wide semantic-generation">
        <div className="panel-kicker">第一步 · 物理世界重建</div>
        <h2>上传无人机航拍视频，生成完整低空物理世界</h2>
        <p className="page-lead">
          先把卫星地图作为空间基准，再接入该区域的无人机航拍视频。系统会自动抽帧、估计相机位姿、对齐地图数据、恢复建筑与地面空间，并生成可查询、可推演、可渲染的低空物理世界模型。
        </p>

        <div className="semantic-upload-row">
          <label className={`video-upload-card ${status !== "empty" ? "has-video" : ""}`}>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
            <span>{status === "empty" ? "上传无人机航拍视频" : "更换航拍视频"}</span>
            <strong>{videoName || "上传后自动生成区域物理世界重建"}</strong>
          </label>
          <div className={`generation-status-card generation-status-card--${status}`}>
            <span>生成状态</span>
            <strong>{statusText}</strong>
            <small>地图基准：卫星底图、兴隆湖水域边界、道路结构、起降资源点和兴趣点数据</small>
          </div>
        </div>

        <div className="reconstruction-metrics">
          <div>
            <span>重建范围</span>
            <strong>{status === "empty" ? "待生成" : "2.8 平方公里"}</strong>
          </div>
          <div>
            <span>空间对象</span>
            <strong>{status === "empty" ? "待生成" : "438 个"}</strong>
          </div>
          <div>
            <span>可飞体素</span>
            <strong>{status === "empty" ? "待生成" : "12.6 万"}</strong>
          </div>
          <div>
            <span>可渲染视角</span>
            <strong>{status === "empty" ? "待生成" : "任意轨迹"}</strong>
          </div>
        </div>

        <div className="semantic-pipeline">
          {pipelineSteps.map(([title, description], index) => (
            <div key={title} className={`pipeline-node ${status !== "empty" ? "is-active" : ""}`} style={{ animationDelay: `${index * 0.12}s` }}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <small>{description}</small>
            </div>
          ))}
        </div>

        <div className="semantic-workbench">
          <div className="semantic-preview" aria-label="语义生成预览">
            <div className={`satellite-tile ${status === "generating" ? "is-scanning" : ""}`}>
              {videoUrl && <video className="semantic-video-preview" src={videoUrl} muted loop autoPlay playsInline />}
              <span className="lake-shape"></span>
              <span className="road-line road-line--one"></span>
              <span className="road-line road-line--two"></span>
              <span className="building-cluster building-cluster--one"></span>
              <span className="building-cluster building-cluster--two"></span>
              <span className="reconstruction-mesh reconstruction-mesh--one"></span>
              <span className="reconstruction-mesh reconstruction-mesh--two"></span>
              <span className="height-column height-column--one">建筑高度</span>
              <span className="height-column height-column--two">树阵障碍</span>
              <span className="flight-frame flight-frame--one">关键帧一</span>
              <span className="flight-frame flight-frame--two">关键帧二</span>
              {(status === "generating" || status === "generated") &&
                generatedLayers.map(
                  (layer, index) =>
                    (status === "generating" || activeLayers.has(layer.id)) && (
                      <span
                        key={layer.id}
                        className={`generated-overlay generated-overlay--${layer.id}`}
                        style={{ borderColor: layer.color, backgroundColor: `${layer.color}26`, animationDelay: `${index * 0.08}s` }}
                      />
                    )
                )}
              {status === "generated" &&
                manualItems.map((item, index) => (
                  <span key={item} className={`manual-pin manual-pin--${index + 1}`}>
                    {item}
                  </span>
                ))}
              {status === "generated" && <div className="world-model-badge">物理世界重建完成 · 支持任意第一视角生成</div>}
              {status === "empty" && <div className="semantic-empty-mask">上传航拍视频后，系统将在地图基准上生成完整物理世界重建</div>}
            </div>
          </div>

          <div className="semantic-layer-panel">
            <h3>重建结果</h3>
            <div className="generated-layer-list">
              {generatedLayers.map((layer) => (
                <button
                  key={layer.id}
                  className={`generated-layer-card ${activeLayers.has(layer.id) ? "is-on" : ""}`}
                  type="button"
                  disabled={status === "empty"}
                  onClick={() => toggleLayer(layer.id)}
                >
                  <span className="generated-layer-card__head">
                    <i style={{ backgroundColor: layer.color }} />
                    <strong>{layer.name}</strong>
                    <em>{status === "empty" ? "待生成" : `${layer.confidence}%`}</em>
                  </span>
                  <small>{layer.source}</small>
                  <span>{layer.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="semantic-lower-grid">
          <div className="semantic-manual-panel">
            <h3>人工补充世界知识</h3>
            <p>重建完成后，业务人员可以继续追加临时规则和现场判断，补充结果进入同一套世界模型版本。</p>
            <div className="manual-chip-list">
              {manualSemantics.map((item) => (
                <button key={item} className={`manual-chip ${manualItems.includes(item) ? "is-on" : ""}`} type="button" onClick={() => toggleManualItem(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="semantic-connector-panel">
            <h3>参与重建的数据源</h3>
            <div className="connector-grid">
              {connectorCards.map(([title, description]) => (
                <div key={title}>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="semantic-output-bar">
          <div>
            <span>当前输出</span>
            <strong>{status === "empty" ? "等待视频输入" : `${generatedCount} 类世界模型图层 · ${manualItems.length} 类人工知识`}</strong>
          </div>
          <div className="semantic-output-actions">
            <button className="button button--secondary" disabled={status === "empty"} onClick={() => runGeneration(videoName || "飞行视频")}>
              重新重建世界
            </button>
            <button className="button" disabled={status !== "generated"} onClick={goNext}>进入第一视角生成</button>
          </div>
        </div>
      </div>
    </section>
  );
}
