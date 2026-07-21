import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import type { Task } from "../types";
import { needsHumanConfirmation, parseTaskIntent, taskExamples } from "../utils/taskParser";

type TaskIntentPageProps = {
  activeTask?: Task;
  onTaskParsed: (task: Task) => void;
  goNext: () => void;
};

const taskTypeLabel: Record<Task["type"], string> = {
  inspection: "城市巡检",
  emergency: "应急侦察",
  delivery: "低空配送"
};

const priorityTone: Record<Task["priority"], "idle" | "active" | "warning" | "danger"> = {
  normal: "active",
  high: "warning",
  critical: "danger"
};

const priorityLabel: Record<Task["priority"], string> = {
  normal: "普通",
  high: "较高",
  critical: "紧急"
};

const payloadLabel: Record<Task["requiredPayloads"][number], string> = {
  hd_camera: "高清相机",
  thermal: "热成像",
  speaker: "喊话器",
  delivery_box: "配送箱"
};

function formatTarget(task: Task) {
  if (task.targetAreaId === "area-a") return "甲区域";
  if (task.targetPoint) return `乙点 (${task.targetPoint.x}, ${task.targetPoint.y})`;
  if (task.startDockId && task.endPoint) return `起降点甲 → 配送点 (${task.endPoint.x}, ${task.endPoint.y})`;
  return "待识别";
}

export function TaskIntentPage({ activeTask, onTaskParsed, goNext }: TaskIntentPageProps) {
  const [input, setInput] = useState(taskExamples[0].text);
  const [selectedExampleId, setSelectedExampleId] = useState(taskExamples[0].id);
  const canParse = input.trim().length > 0;

  function selectExample(exampleId: string) {
    const example = taskExamples.find((item) => item.id === exampleId);
    if (!example) return;
    setSelectedExampleId(example.id);
    setInput(example.text);
  }

  function parseCurrentTask() {
    if (!canParse) return;
    onTaskParsed(parseTaskIntent(input));
  }

  return (
    <section className="page-grid page-grid--single">
      <div className="panel panel--wide">
        <div className="panel-kicker">任务意图</div>
        <h2>自然语言任务入口</h2>
        <p className="page-lead">用户表达任务目标，系统将自然语言转化为结构化低空任务。</p>

        <div className="example-grid">
          {taskExamples.map((example) => (
            <button
              key={example.id}
              className={`example-card ${selectedExampleId === example.id ? "is-selected" : ""}`}
              onClick={() => selectExample(example.id)}
            >
              <span>{example.label}</span>
              <small>{example.text}</small>
            </button>
          ))}
        </div>

        <div className="input-console">
          <label htmlFor="task-input">任务描述</label>
          <textarea
            id="task-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="请输入低空任务目标，例如：对甲区域进行低空巡检..."
          />
          <div className="console-actions">
            <span>本地规则解析 · 不调用真实大模型服务</span>
            <button className="button" disabled={!canParse} onClick={parseCurrentTask}>解析任务</button>
          </div>
        </div>

        {activeTask && (
          <div className="result-panel">
            <div className="result-header">
              <div>
                <div className="panel-kicker">结构化任务</div>
                <h3>{activeTask.title}</h3>
              </div>
              <StatusBadge label="已解析" tone="done" />
            </div>

            <div className="task-result-grid">
              <div className="result-item">
                <span>任务类型</span>
                <strong>{taskTypeLabel[activeTask.type]}</strong>
              </div>
              <div className="result-item">
                <span>目标区域 / 目标点</span>
                <strong>{formatTarget(activeTask)}</strong>
              </div>
              <div className="result-item">
                <span>任务优先级</span>
                <StatusBadge label={priorityLabel[activeTask.priority]} tone={priorityTone[activeTask.priority]} />
              </div>
              <div className="result-item">
                <span>是否需要人工确认</span>
                <strong>{needsHumanConfirmation(activeTask) ? "需要" : "不需要"}</strong>
              </div>
            </div>

            <div className="parse-columns">
              <div>
                <span className="column-label">载荷需求</span>
                <ul>{activeTask.requiredPayloads.map((item) => <li key={item}>{payloadLabel[item]}</li>)}</ul>
              </div>
              <div>
                <span className="column-label">约束条件</span>
                <ul>{activeTask.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div>
                <span className="column-label">交付物</span>
                <ul>{activeTask.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>

            <div className="console-actions">
              <span>任务状态已写入全局状态：已解析</span>
              <button className="button" onClick={goNext}>进入资源调度</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
