import { useMemo, useState } from "react";

type PageProps = {
  goNext: () => void;
};

type TrajectoryMode = "lake" | "corridor" | "urban";

const trajectoryModes: Array<{
  id: TrajectoryMode;
  name: string;
  description: string;
  color: string;
}> = [
  {
    id: "lake",
    name: "环湖巡检轨迹",
    description: "沿兴隆湖岸线低速飞行，优先观察水岸、步道和亲水设施。",
    color: "#22d3ee"
  },
  {
    id: "corridor",
    name: "低空通道轨迹",
    description: "沿重建出的可飞走廊穿越湖区，保持安全高度和避障距离。",
    color: "#22c55e"
  },
  {
    id: "urban",
    name: "城市边缘轨迹",
    description: "贴近建筑和树阵边界飞行，验证第一视角中的遮挡和深度关系。",
    color: "#f59e0b"
  }
];

export function FlightViewGenerationPage({ goNext }: PageProps) {
  const [mode, setMode] = useState<TrajectoryMode>("lake");
  const [altitude, setAltitude] = useState(80);
  const [speed, setSpeed] = useState(8);
  const [heading, setHeading] = useState(36);
  const [generating, setGenerating] = useState(false);

  const selectedMode = trajectoryModes.find((item) => item.id === mode) ?? trajectoryModes[0];
  const viewLabel = useMemo(() => {
    if (mode === "lake") return "湖岸、水面反光、步道和亲水平台";
    if (mode === "corridor") return "低空通道、起降资源、避障缓冲和巡航方向";
    return "建筑立面、树阵遮挡、道路边界和人群活动";
  }, [mode]);

  function regenerateView(nextMode = mode) {
    setMode(nextMode);
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 680);
  }

  return (
    <section className="page-grid page-grid--single">
      <div className="panel panel--wide view-generation">
        <div className="panel-kicker">第二步 · 第一视角生成</div>
        <h2>基于重建世界，以任意飞行轨迹生成第一视角画面</h2>
        <p className="page-lead">
          物理世界重建完成后，系统不只知道地图上有什么，还能从任意无人机位置、航向、高度和速度出发，实时生成无人机第一视角应该看到的画面，用于任务预演、路线验证和风险解释。
        </p>

        <div className="view-generation-layout">
          <div className="first-person-panel">
            <div className={`first-person-view first-person-view--${mode} ${generating ? "is-generating" : ""}`}>
              <div className="sky-band"></div>
              <div className="horizon-line"></div>
              <div className="generated-lake"></div>
              <div className="generated-road generated-road--left"></div>
              <div className="generated-road generated-road--right"></div>
              <div className="generated-building generated-building--one"></div>
              <div className="generated-building generated-building--two"></div>
              <div className="generated-tree-row"></div>
              <div className="flight-hud">
                <span>高度 {altitude} 米</span>
                <span>速度 {speed} 米/秒</span>
                <span>航向 {heading} 度</span>
              </div>
              <div className="view-crosshair"></div>
              <div className="view-caption">
                <strong>{selectedMode.name}</strong>
                <span>当前画面包含：{viewLabel}</span>
              </div>
              {generating && <div className="view-generating-mask">正在从世界模型生成第一视角画面</div>}
            </div>
          </div>

          <aside className="trajectory-panel">
            <h3>轨迹输入</h3>
            <div className="trajectory-list">
              {trajectoryModes.map((item) => (
                <button
                  key={item.id}
                  className={`trajectory-card ${mode === item.id ? "is-selected" : ""}`}
                  type="button"
                  onClick={() => regenerateView(item.id)}
                >
                  <span className="trajectory-dot" style={{ backgroundColor: item.color }} />
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>

            <div className="trajectory-controls">
              <label>
                <span>飞行高度</span>
                <input type="range" min="40" max="140" value={altitude} onChange={(event) => setAltitude(Number(event.target.value))} />
                <strong>{altitude} 米</strong>
              </label>
              <label>
                <span>飞行速度</span>
                <input type="range" min="4" max="18" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
                <strong>{speed} 米/秒</strong>
              </label>
              <label>
                <span>相机航向</span>
                <input type="range" min="0" max="359" value={heading} onChange={(event) => setHeading(Number(event.target.value))} />
                <strong>{heading} 度</strong>
              </label>
            </div>

            <button className="button dispatch-confirm" type="button" onClick={() => regenerateView()}>
              按当前轨迹重新生成画面
            </button>
          </aside>
        </div>

        <div className="view-capability-grid">
          <div>
            <span>输入</span>
            <strong>任意轨迹</strong>
            <small>位置、高度、航向、速度、相机姿态</small>
          </div>
          <div>
            <span>基础</span>
            <strong>重建世界</strong>
            <small>三维结构、材质、道路、水域、障碍物</small>
          </div>
          <div>
            <span>输出</span>
            <strong>第一视角画面</strong>
            <small>实时生成应看到的画面和关键语义</small>
          </div>
          <div>
            <span>用途</span>
            <strong>任务预演</strong>
            <small>提前验证路线、风险、遮挡和目标可见性</small>
          </div>
        </div>

        <button className="button dispatch-confirm" onClick={goNext}>进入世界总览</button>
      </div>
    </section>
  );
}
