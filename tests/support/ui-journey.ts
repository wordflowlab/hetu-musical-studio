import { expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  selection,
  base,
  sha,
  reviewTarget,
  changed,
  refix,
} from "./scenario.ts";
async function files(c: any, page: any, record: any, exports: string) {
  const current = await c.invoke("get_project", {
    object_id: record.object.object_id,
  });
  for (const [button, action] of [
    ["导出专业阅读本", "export_reading"],
    ["导出完整审核本", "export_review"],
  ]) {
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.getByRole("status")).toContainText(
      "文件已按固定修订导出",
    );
    const expected = await c.invoke(action, {
      ...selection(current),
      max_bytes: 65536,
    });
    expect(expected.next_offset).toBeNull();
    expect(sha(await readFile(path.join(exports, expected.filename)))).toBe(
      expected.sha256,
    );
  }
}
async function handoff(page: any, app: any) {
  await page
    .getByRole("button", { name: "准备固定创作交接", exact: true })
    .click();
  await expect(page.getByLabel("固定依据")).toContainText("目标");
  await page.getByRole("button", { name: "关闭依据" }).click();
  await page.getByRole("button", { name: "让AI处理", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已复制");
  expect(
    await app.evaluate(({ clipboard }: any) => clipboard.readText()),
  ).toContain("org.wordflowlab.");
}
export async function professionalJourney({
  c,
  page,
  tab,
  record,
  exports,
  app,
}: any) {
  await tab(0);
  await expect(page.locator(".reading")).toContainText("来信二重唱");
  await tab(1);
  await expect(page.locator("svg.singing-map rect")).toHaveCount(3);
  await tab(2);
  await page.getByLabel("当前编排").selectOption("alternate");
  await expect(page.locator(".warning")).toContainText("尚未演出原段");
  await page
    .getByRole("button", { name: "核对顺序与精确估时", exact: true })
    .click();
  await expect(page.getByLabel("固定依据")).toContainText("13");
  await page.getByRole("button", { name: "关闭依据" }).click();
  await tab(3);
  await page.getByLabel("当前编排").selectOption("linear");
  await page.getByRole("button", { name: "固定排练快照", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page
    .getByRole("button", { name: "查看固定排练记录", exact: true })
    .click();
  await expect(page.getByLabel("固定依据")).toContainText("尚未登记真人排练");
  await page.getByRole("button", { name: "关闭依据" }).click();
  await tab(3);
  await page.getByText("为具体目标留意见", { exact: true }).click();
  await page
    .getByLabel("意见目标")
    .selectOption(reviewTarget.kind + ":" + reviewTarget.id);
  await page
    .getByLabel("专业意见")
    .fill("请保留固定依据，并说明本次修改对下一轮的影响。");
  await page.getByRole("button", { name: "保存固定意见", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await tab(4);
  await files(c, page, record, exports);
  await handoff(page, app);
}
export async function finishJourney({ c, page, record }: any) {
  let r = await c.invoke("get_project", { object_id: record.object.object_id }),
    d = changed(r.object.content);
  r = await c.invoke(d.action, { ...base(r, "ui-rework"), [d.field]: d.value });
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await page.getByRole("button", { name: "排练与复核", exact: true }).click();
  await page
    .getByRole("button", { name: "重新固定此主题再现", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.getByLabel("当前编排").selectOption("linear");
  await page
    .getByRole("button", { name: "重新固定所选编排", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("已保存");
  const now = await c.invoke("get_project", {
    object_id: record.object.object_id,
  });
  expect(
    (await c.invoke("check_musical", selection(now))).stale_program_ids,
  ).not.toContain("linear");
}
