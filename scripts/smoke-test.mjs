import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const pageUrl = process.env.DEMO_URL ?? "http://localhost:5173/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.goto(pageUrl, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /启动一键演示/ }).click();
await page.getByRole("button", { name: "解析任务" }).click();
await page.getByRole("button", { name: /进入资源调度/ }).click();
await page.getByRole("button", { name: /确认资源并进入航线规划/ }).click();
await page.getByRole("button", { name: /进入风险推演/ }).click();
await page.getByRole("button", { name: /确认风险并进入执行/ }).click();
await page.getByRole("button", { name: "触发动态事件" }).click();
await page.getByRole("button", { name: /采用重规划方案/ }).click();
await page.getByRole("button", { name: "开始执行" }).click();
await page.waitForFunction(() => document.body.innerText.includes("任务完成"), null, { timeout: 30000 });
await page.getByRole("button", { name: /进入结果闭环/ }).click();
await page.getByRole("button", { name: /生成任务报告/ }).click();
await page.waitForFunction(() => document.body.innerText.includes("报告 JSON 预览"), null, { timeout: 10000 });

if (consoleErrors.length > 0) {
  console.error(consoleErrors.join("\n"));
  await browser.close();
  process.exit(1);
}

console.log("Smoke flow passed");
await browser.close();
