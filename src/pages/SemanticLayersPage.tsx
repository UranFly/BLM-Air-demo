import type { DemoState, LayerState } from "../types";

type PageProps = {
  state: DemoState;
  setLayers: (layers: LayerState) => void;
  goNext: () => void;
};

const injectionLabels: Array<[keyof LayerState, string, string, string]> = [
  ["airspace", "空域规则", "人工注入禁飞区、限高区、临时管制区和缓冲半径", "生成可校验的空域约束语义"],
  ["resources", "资源网络", "人工注入起降点、机库、无人机、载荷、电量和服务半径", "生成可调度的资源网络语义"],
  ["risks", "风险环境", "人工注入通信弱覆盖、施工区域、临时人群和气象修正", "生成动态风险语义"],
  ["tasks", "任务语义", "人工注入巡检对象、配送点、应急点和优先级规则", "生成任务目标语义"],
  ["spatial", "空间修正", "人工修正边界、通行区、敏感区和运营边界", "生成空间规则语义"],
  ["results", "结果数据", "人工注入验收标准、报告字段和数据归档规则", "生成交付闭环语义"]
];

export function SemanticLayersPage({ state, setLayers, goNext }: PageProps) {
  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">语义注入</div>
        <h2>人工注入多源数据，自动生成业务语义</h2>
        <p className="page-lead">在物理世界重建之外，业务人员可以把规则、资源、风险、任务和交付要求注入世界模型，系统自动生成可被调度、推演和验证的语义。</p>
        <div className="layer-list semantic-injection-list">
          {injectionLabels.map(([key, title, input, output]) => (
            <label key={key} className="layer-row">
              <input
                type="checkbox"
                checked={state.enabledLayers[key]}
                onChange={(event) => setLayers({ ...state.enabledLayers, [key]: event.target.checked })}
              />
              <span>
                <strong>{title}</strong>
                <small>{input}</small>
                <em>{output}</em>
              </span>
            </label>
          ))}
        </div>
      </div>
      <aside className="panel">
        <div className="panel-kicker">注入结果</div>
        <h3>人工知识已进入世界模型</h3>
        <p>后续静态语义生成会使用这些注入数据，自动生成空域规则、资源网络、风险环境和任务语义。</p>
        <div className="injection-summary">
          <div>
            <span>已启用注入</span>
            <strong>{Object.values(state.enabledLayers).filter(Boolean).length} 类</strong>
          </div>
          <div>
            <span>核心输出</span>
            <strong>空域规则 · 资源网络</strong>
          </div>
        </div>
        <button className="button" onClick={goNext}>进入语义生成</button>
      </aside>
    </section>
  );
}
