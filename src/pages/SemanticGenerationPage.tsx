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
    name: "空间区域语义",
    source: "地图底图 + 视频抽帧",
    confidence: 92,
    color: "#22d3ee",
    description: "从兴隆湖水域、道路、绿地、建筑和广场边界生成可计算的空间面。"
  },
  {
    id: "airspace",
    name: "空域规则",
    source: "地图边界 + 人工规则",
    confidence: 88,
    color: "#f59e0b",
    description: "结合湖面、道路、人群和敏感区域推导限高、禁飞、缓冲区和临时管制。"
  },
  {
    id: "resources",
    name: "资源网络",
    source: "起降点 + 飞行轨迹",
    confidence: 95,
    color: "#22c55e",
    description: "把起降点、无人机航迹、返航半径和可用载荷组织成调度资源图。"
  },
  {
    id: "risk",
    name: "风险环境",
    source: "视频识别 + 实时气象",
    confidence: 84,
    color: "#ef4444",
    description: "识别障碍物、人群密度、通信弱覆盖、阵风和降雨风险，支持动态避让。"
  },
  {
    id: "task",
    name: "任务语义",
    source: "高德兴趣点 + 业务目标",
    confidence: 90,
    color: "#a78bfa",
    description: "把巡检、配送、应急、安防等目标映射成任务点、优先级和交付物。"
  }
];

const manualSemantics = ["临时起降区", "临时禁飞区", "人群聚集点", "应急通道", "重点巡检对象"];

const connectorCards = [
  ["高德地图数据", "兴隆湖底图、水域边界、道路结构、建筑轮廓"],
  ["高德兴趣点数据", "园区、道路、服务点、公共设施进入任务语义层"],
  ["实时气象数据", "风速、风向、降雨、能见度进入风险环境层"],
  ["无人机图传视频", "实时识别水岸、障碍物、人群、施工和临时变化"]
];

const pipelineSteps = [
  ["抽帧", "从上传视频提取关键帧"],
  ["配准", "对齐高德底图与水域边界"],
  ["识别", "分割道路、水域、建筑和活动区域"],
  ["生成", "输出可开关的低空语义图层"]
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
    if (status === "generating") return "正在结合地图数据生成语义";
    return "语义图层已生成";
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
        <div className="panel-kicker">第一步 · 语义生成</div>
        <h2>上传无人机飞行视频，自动生成低空语义图层</h2>
        <p className="page-lead">
          先把真实地图数据作为空间基准，再接入该区域的无人机飞行图传视频。系统会自动抽帧、配准、识别和融合，生成空间区域、空域规则、资源网络、风险环境和任务语义；人工仍可继续补充临时语义。
        </p>

        <div className="semantic-upload-row">
          <label className={`video-upload-card ${status !== "empty" ? "has-video" : ""}`}>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
            <span>{status === "empty" ? "上传无人机飞行视频" : "更换飞行视频"}</span>
            <strong>{videoName || "支持本地视频文件，上传后自动生成语义"}</strong>
          </label>
          <div className={`generation-status-card generation-status-card--${status}`}>
            <span>生成状态</span>
            <strong>{statusText}</strong>
            <small>地图基准：高德兴隆湖底图、水域边界、起降资源点、道路与兴趣点数据</small>
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
              <span className="flight-frame flight-frame--one">图传帧一</span>
              <span className="flight-frame flight-frame--two">图传帧二</span>
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
              {status === "empty" && <div className="semantic-empty-mask">上传飞行视频后，系统将在地图基准上自动生成语义图层</div>}
            </div>
          </div>

          <div className="semantic-layer-panel">
            <h3>自动生成结果</h3>
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
            <h3>人工补充语义</h3>
            <p>自动生成后，业务人员可以继续追加临时规则和现场判断，补充结果进入同一套语义图层版本。</p>
            <div className="manual-chip-list">
              {manualSemantics.map((item) => (
                <button key={item} className={`manual-chip ${manualItems.includes(item) ? "is-on" : ""}`} type="button" onClick={() => toggleManualItem(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="semantic-connector-panel">
            <h3>参与生成的数据源</h3>
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
            <strong>{status === "empty" ? "等待视频输入" : `${generatedCount} 类自动语义 · ${manualItems.length} 类人工语义`}</strong>
          </div>
          <div className="semantic-output-actions">
            <button className="button button--secondary" disabled={status === "empty"} onClick={() => runGeneration(videoName || "飞行视频")}>
              重新生成语义
            </button>
            <button className="button" disabled={status !== "generated"} onClick={goNext}>进入世界总览</button>
          </div>
        </div>
      </div>
    </section>
  );
}
