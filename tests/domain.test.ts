import { test } from "node:test";
import assert from "node:assert/strict";
import { scenario, temporary } from "./support/scenario.ts";
import { validate, clone } from "../src/domain/model.ts";
import * as E from "../src/domain/engine.ts";
test("二重唱同拍不重复累加", () =>
  assert.deepEqual(E.passageTime(scenario().passages[1]), {
    numerator: "2",
    denominator: "1",
    unit: "seconds",
  }));
test("明确对白及歌曲加间隔精确估时", () =>
  assert.deepEqual(E.programView(scenario(), "linear").estimated_time, {
    numerator: "13",
    denominator: "2",
    unit: "seconds",
  }));
test("未知BPM不补120", () => {
  const p = scenario();
  p.passages[1].bpm = null;
  assert.equal(E.passageTime(p.passages[1]), null);
  assert.equal(E.programView(p, "linear").estimated_time, null);
});
test("未知对白估时不补零", () => {
  const p = scenario();
  p.passages[0].estimate_ms = null;
  assert.equal(E.programView(p, "linear").estimated_time, null);
});
test("缺演唱者拒绝", () => {
  const p = scenario();
  p.passages[1].lines[0].speaker_ids = [];
  assert.throws(() => validate(p));
});
test("悬空演唱角色拒绝", () => {
  const p = scenario();
  p.passages[1].lines[0].speaker_ids = ["unknown"];
  assert.throws(() => validate(p));
});
test("同人重叠唱词拒绝", () => {
  const p = scenario();
  p.passages[1].lines[1].speaker_ids = ["lin"];
  assert.throws(() => validate(p));
});
test("多人同时演唱允许", () => assert.doesNotThrow(() => validate(scenario())));
test("唱词越过总节拍拒绝", () => {
  const p = scenario();
  p.passages[1].lines[0].end_tick = 4000;
  assert.throws(() => validate(p));
});
test("对白不能混入歌曲节拍", () => {
  const p = scenario();
  p.passages[0].ticks = 960;
  assert.throws(() => validate(p));
});
test("歌曲不能把估时混成实际时长", () => {
  const p = scenario();
  p.passages[1].estimate_ms = 2000;
  assert.throws(() => validate(p));
});
test("先再现后原唱明确警告", () =>
  assert.equal(E.programView(scenario(), "alternate").warnings.length, 1));
test("顺序正常无再现先后警告", () =>
  assert.equal(E.programView(scenario(), "linear").warnings.length, 0));
test("相同唱段重复出场允许", () => {
  const p = scenario();
  p.programs[0].items.push({
    ...p.programs[0].items[1],
    id: "repeat",
    order: 4,
  });
  assert.doesNotThrow(() => validate(p));
});
test("重复出场ID或顺序拒绝", () => {
  const p = scenario();
  p.programs[0].items.push({ ...p.programs[0].items[1], id: "repeat" });
  assert.throws(() => validate(p));
});
test("再现两端不能同段", () => {
  const p = scenario();
  p.reprises[0].return_passage_id = "duet";
  assert.throws(() => validate(p));
});
test("改唱段后旧编排再现及意见待复核", () => {
  const p = scenario(),
    old = clone(p);
  p.passages[1].objective = "新的戏剧目标";
  validate(p);
  E.validateTransition(p, old);
  const check = E.check(p);
  assert.equal(check.stale_program_ids.length, 2);
  assert.equal(check.stale_reprise_ids.length, 1);
  assert.equal(check.stale_note_ids.length, 1);
});
test("新编排不能使用假依据", () => {
  const p = scenario(),
    old = clone(p);
  p.programs[0].rationale = "改变";
  p.programs[0].basis_sha256 = "0".repeat(64);
  assert.throws(() => E.validateTransition(p, old));
});
test("排练保留完整旧快照", () => {
  const p = scenario();
  p.rehearsals = [temporary(p).rehearsal];
  validate(p);
  const old = clone(p);
  p.passages[1].objective = "新版";
  validate(p);
  E.validateTransition(p, old);
  assert.notEqual(
    p.passages[1].objective,
    p.rehearsals[0].snapshot.passages[1].objective,
  );
});
test("全量保存不能改旧排练", () => {
  const p = scenario();
  p.rehearsals = [temporary(p).rehearsal];
  const old = clone(p);
  p.rehearsals[0].declaration = "伪改";
  assert.throws(() => E.validateTransition(p, old));
});
test("排练手记不能指向不存在出场", () => {
  const p = scenario();
  p.rehearsals = [
    {
      ...temporary(p).rehearsal,
      outcomes: [
        {
          occurrence_id: "missing",
          at_ms: 0,
          result: "unknown",
          comment: "没有该出场",
        },
      ],
    },
  ];
  assert.throws(() => validate(p));
});
test("阅读本保留两位唱词及戏剧目的", () => {
  const s = E.reading(scenario());
  assert.ok(s.includes("林溪"));
  assert.ok(s.includes("守站人"));
  assert.ok(s.includes("共同打开来信"));
});
