import type { Point, Task, TaskType } from "../types";

export type TaskExample = {
  id: string;
  label: string;
  type: TaskType;
  text: string;
};

export const taskExamples: TaskExample[] = [
  {
    id: "inspection-a",
    label: "城市巡检",
    type: "inspection",
    text: "对甲区域进行低空巡检，覆盖重点设施，避开限飞区，并生成巡检报告。"
  },
  {
    id: "emergency-b",
    label: "应急侦察",
    type: "emergency",
    text: "乙点发生突发事件，派最近的可用无人机前往侦察，并回传现场图像。"
  },
  {
    id: "delivery-c",
    label: "低空配送",
    type: "delivery",
    text: "从起降点甲向配送点进行小件配送，选择风险最低路线，并记录交付结果。"
  }
];

const pointB: Point = { x: 820, y: 170 };
const pointC: Point = { x: 820, y: 575 };

export function detectTaskType(input: string): TaskType {
  if (input.includes("配送") || input.includes("运送") || input.includes("小件")) {
    return "delivery";
  }

  if (input.includes("突发事件") || input.includes("侦察") || input.includes("应急")) {
    return "emergency";
  }

  return "inspection";
}

export function parseTaskIntent(input: string): Task {
  const normalizedInput = input.trim();
  const taskType = detectTaskType(normalizedInput);
  const id = `task-${taskType}-${Date.now()}`;

  if (taskType === "emergency") {
    return {
      id,
      title: "乙点应急侦察",
      type: "emergency",
      priority: "high",
      targetPoint: pointB,
      constraints: ["最近可用资源优先", "快速抵达", "避开限制区"],
      requiredPayloads: ["hd_camera"],
      deliverables: ["现场图像", "侦察摘要", "风险记录"],
      status: "parsed",
      createdFrom: normalizedInput
    };
  }

  if (taskType === "delivery") {
    return {
      id,
      title: "起降点甲至配送点低空配送",
      type: "delivery",
      priority: "normal",
      startDockId: "dock-a",
      endPoint: pointC,
      constraints: ["风险最低", "电量满足", "避开禁飞区"],
      requiredPayloads: ["delivery_box"],
      deliverables: ["配送轨迹", "交付记录", "异常记录"],
      status: "parsed",
      createdFrom: normalizedInput
    };
  }

  return {
    id,
    title: "甲区域低空巡检",
    type: "inspection",
    priority: "normal",
    targetAreaId: "area-a",
    constraints: ["避开限飞区", "覆盖重点设施"],
    requiredPayloads: ["hd_camera"],
    deliverables: ["巡检报告", "轨迹回放", "异常点记录"],
    status: "parsed",
    createdFrom: normalizedInput
  };
}

export function needsHumanConfirmation(task: Task): boolean {
  return task.priority !== "normal" || task.constraints.some((constraint) => constraint.includes("避开"));
}
