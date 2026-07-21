import { useState } from "react";

type PageProps = {
  goNext: () => void;
};

type StaticSemanticLayer = {
  id: string;
  name: string;
  source: string;
  count: string;
  color: string;
  description: string;
};

const staticSemanticLayers: StaticSemanticLayer[] = [
  {
    id: "object",
    name: "对象语义",
    source: "物理世界重建",
    count: "438 个对象",
    color: "#22d3ee",
    description: "将建筑、水域、道路、树阵、起降点、设施和障碍物识别为可查询对象。"
  },
  {
    id: "space",
    name: "空间语义",
    source: "三维结构与地表分割",
    count: "32 个空间面",
    color: "#22c55e",
    description: "生成水域、可通行岸线、城市核心区、开放广场、缓冲带和任务区域。"
  },
  {
    id: "flight",
    name: "低空飞行语义",
    source: "可飞体素与高度场",
    count: "12.6 万体素",
    color: "#f59e0b",
    description: "生成可飞走廊、推荐高度、避障缓冲、视线遮挡和安全穿越区域。"
  },
  {
    id: "relation",
    name: "关系语义",
    source: "对象拓扑与距离场",
    count: "216 条关系",
    color: "#a78bfa",
    description: "建立对象之间的邻接、遮挡、距离、通视和任务可达关系。"
  }
];

export function StaticSemanticGenerationPage({ goNext }: PageProps) {
  const [enabledLayers, setEnabledLayers] = useState(() => new Set(staticSemanticLayers.map((layer) => layer.id)));

  function toggleLayer(layerId: string) {
    setEnabledLayers((current) => {
      const next = new Set(current);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }

  return (
    <section className="page-grid page-grid--single">
      <div className="panel panel--wide static-semantic-page">
        <div className="panel-kicker">第四步 · 语义生成</div>
        <h2>基于重建低空物理世界，自动生成静态语义图层</h2>
        <p className="page-lead">
          物理世界重建提供几何、材质、对象和空间关系；语义注入提供规则和业务知识。系统在此基础上自动生成静态语义图层，让世界模型从“能看见”升级为“能理解、能查询、能推演”。
        </p>

        <div className="semantic-generation-board">
          <div className="semantic-world-preview">
            <span className="semantic-map-water"></span>
            <span className="semantic-map-road semantic-map-road--one"></span>
            <span className="semantic-map-road semantic-map-road--two"></span>
            <span className="semantic-map-block semantic-map-block--one">建筑群</span>
            <span className="semantic-map-block semantic-map-block--two">树阵</span>
            {staticSemanticLayers.map(
              (layer, index) =>
                enabledLayers.has(layer.id) && (
                  <span
                    key={layer.id}
                    className={`static-semantic-overlay static-semantic-overlay--${layer.id}`}
                    style={{ borderColor: layer.color, backgroundColor: `${layer.color}24`, animationDelay: `${index * 0.08}s` }}
                  >
                    {layer.name}
                  </span>
                )
            )}
          </div>

          <div className="static-semantic-list">
            <h3>自动生成结果</h3>
            {staticSemanticLayers.map((layer) => (
              <button key={layer.id} type="button" className={`static-semantic-card ${enabledLayers.has(layer.id) ? "is-on" : ""}`} onClick={() => toggleLayer(layer.id)}>
                <span className="static-semantic-card__head">
                  <i style={{ backgroundColor: layer.color }} />
                  <strong>{layer.name}</strong>
                  <em>{layer.count}</em>
                </span>
                <small>{layer.source}</small>
                <span>{layer.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="static-semantic-output">
          <div>
            <span>生成后的模型能力</span>
            <strong>对象可查询 · 空间可计算 · 低空可推演 · 轨迹可验证</strong>
          </div>
          <button className="button" onClick={goNext}>进入世界总览</button>
        </div>
      </div>
    </section>
  );
}
