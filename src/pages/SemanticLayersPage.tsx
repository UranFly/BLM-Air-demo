import type { DemoState, LayerState } from "../types";

type PageProps = {
  state: DemoState;
  setLayers: (layers: LayerState) => void;
  goNext: () => void;
};

const layerLabels: Array<[keyof LayerState, string, string]> = [
  ["spatial", "空间区域", "巡检区、城市核心区、配送目标和应急点"],
  ["airspace", "空域规则", "禁飞区、限高区、临时管制区"],
  ["resources", "资源网络", "无人机、起降点、载荷与状态"],
  ["risks", "风险环境", "通信、天气、障碍物风险"],
  ["tasks", "任务语义", "目标区域、任务点和任务状态"],
  ["results", "结果数据", "报告、轨迹和数据资产"]
];

export function SemanticLayersPage({ state, setLayers, goNext }: PageProps) {
  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">语义图层</div>
        <h2>语义图层管理</h2>
        <p className="page-lead">通过图层配置支持不同低空场景，证明平台泛化能力。</p>
        <div className="layer-list">
          {layerLabels.map(([key, title, description]) => (
            <label key={key} className="layer-row">
              <input
                type="checkbox"
                checked={state.enabledLayers[key]}
                onChange={(event) => setLayers({ ...state.enabledLayers, [key]: event.target.checked })}
              />
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
      <aside className="panel">
        <div className="panel-kicker">阶段 1 状态</div>
        <h3>图层状态已进入全局状态</h3>
        <p>后续地图、航线、风险和报告页面会复用同一组图层开关。</p>
        <button className="button" onClick={goNext}>进入任务意图</button>
      </aside>
    </section>
  );
}
