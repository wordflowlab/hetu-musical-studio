import { createHash } from "node:crypto";
import { newProject, canonical } from "../../src/domain/model.ts";
import { digest } from "../../src/domain/shared.ts";
import * as E from "../../src/domain/engine.ts";
export const original =
  "旧站的灯亮了。她带着来信走进站台。小车在10秒内行驶20米。她只有一张车票。\n";
export const sha = (s: string | Uint8Array) =>
  createHash("sha256").update(s).digest("hex");
export const base = (r: any, key: string) => ({
  object_id: r.object.object_id,
  expected_revision: r.object.revision,
  expected_sha256: r.sha256,
  operation_key: key,
});
export const selection = (r: any) => ({
  object_id: r.object.object_id,
  revision: r.object.revision,
});
export const sourceRef = {
  kind: "resource",
  work_ref: {
    workspace_id: "workspace_test",
    kind: "novel",
    object_id: "novel_test",
  },
  resource_id: "resource_test",
  revision: 1,
  sha256: sha(original),
};
export const quote = (text = original.trim()) => {
  const at = original.indexOf(text);
  if (at < 0) throw Error("引文不存在");
  return {
    id: "evidence",
    source_index: 0,
    byte_start: Buffer.byteLength(original.slice(0, at)),
    byte_end: Buffer.byteLength(original.slice(0, at + text.length)),
    quote: text,
    attribution: "原创虚构演示材料",
  };
};
export function seedSources(c: any) {
  c.sources.set(canonical(sourceRef), {
    source_ref: sourceRef,
    resource: { body: original },
  });
}
export function scenario(): any {
  const p = newProject("旧站音乐剧");
  p.brief = "用对白、双人唱段和尾声再现推进来信故事。";
  p.evidence = [quote()];
  p.characters = [
    {
      id: "lin",
      name: "林溪",
      dramatic_role: "带来未寄出的信。",
      evidence_ids: ["evidence"],
    },
    {
      id: "keeper",
      name: "守站人",
      dramatic_role: "决定是否打开旧站。",
      evidence_ids: ["evidence"],
    },
  ];
  p.scenes = [
    {
      id: "scene",
      title: "旧站的灯",
      order: 1,
      situation: "两人因一封来信重逢。",
      evidence_ids: ["evidence"],
    },
  ];
  p.passages = [
    {
      id: "spoken",
      scene_id: "scene",
      title: "门外对白",
      kind: "dialogue",
      objective: "让两人面对重逢。",
      lines: [
        {
          id: "s1",
          speaker_ids: ["lin"],
          text: "这封信迟到了。",
          start_tick: null,
          end_tick: null,
        },
        {
          id: "s2",
          speaker_ids: ["keeper"],
          text: "站台还在等。",
          start_tick: null,
          end_tick: null,
        },
      ],
      ticks: null,
      bpm: null,
      estimate_ms: 3000,
      evidence_ids: ["evidence"],
    },
    {
      id: "duet",
      scene_id: "scene",
      title: "来信二重唱",
      kind: "song",
      objective: "从犹疑走向共同打开来信。",
      lines: [
        {
          id: "d1",
          speaker_ids: ["lin"],
          text: "灯亮着，信还在。",
          start_tick: 0,
          end_tick: 3840,
        },
        {
          id: "d2",
          speaker_ids: ["keeper"],
          text: "路远了，门未关。",
          start_tick: 0,
          end_tick: 3840,
        },
      ],
      ticks: 3840,
      bpm: 120,
      estimate_ms: null,
      evidence_ids: ["evidence"],
    },
    {
      id: "return",
      scene_id: "scene",
      title: "尾声再现",
      kind: "song",
      objective: "同一主题由等待变成出发。",
      lines: [
        {
          id: "r1",
          speaker_ids: ["lin", "keeper"],
          text: "灯亮着，我们出发。",
          start_tick: 0,
          end_tick: 1920,
        },
      ],
      ticks: 1920,
      bpm: 120,
      estimate_ms: null,
      evidence_ids: ["evidence"],
    },
  ];
  p.motifs = [
    { id: "light", title: "灯与来信", description: "从等待到共同出发。" },
  ];
  p.reprises = [
    {
      id: "reprise",
      motif_id: "light",
      origin_passage_id: "duet",
      return_passage_id: "return",
      rationale: "让同一句主题承担新的行动。",
      basis_sha256: E.repriseBasis(p, "light", "duet", "return"),
    },
  ];
  const items = [
    { id: "a", order: 1, passage_id: "spoken", gap_ms: 0 },
    { id: "b", order: 2, passage_id: "duet", gap_ms: 500 },
    { id: "c", order: 3, passage_id: "return", gap_ms: 0 },
  ];
  p.programs = [
    {
      id: "linear",
      title: "先重逢再出发",
      items,
      basis_sha256: E.programBasis(p, items),
      rationale: "对白建立关系，二重唱形成决定。",
    },
    {
      id: "alternate",
      title: "先听尾声再回望",
      items: [
        { ...items[2], order: 1 },
        { ...items[0], order: 2 },
        { ...items[1], order: 3 },
      ],
      basis_sha256: "",
      rationale: "非线性编排，主题先后须明确审阅。",
    },
  ];
  p.programs[1].basis_sha256 = E.programBasis(p, p.programs[1].items);
  p.notes = [
    {
      id: "note",
      target_kind: "passage",
      target_id: "duet",
      target_sha256: E.targetDigest(p, "passage", "duet"),
      origin: "agent",
      comment: "核对两位人物是否真的同时作出决定。",
      status: "open",
      resolution: "",
    },
  ];
  return p;
}
export const reviewTarget = { kind: "passage", id: "duet" };
export function temporary(p: any): any {
  return {
    evidence: { ...p.evidence[0], id: "temp-evidence" },
    character: { ...p.characters[0], id: "temp-character" },
    scene: { ...p.scenes[0], id: "temp-scene", order: 9 },
    passage: { ...p.passages[0], id: "temp-passage" },
    motif: { ...p.motifs[0], id: "temp-motif" },
    reprise: { ...p.reprises[0], id: "temp-reprise" },
    program: { ...p.programs[0], id: "temp-program" },
    rehearsal: {
      id: "temp-rehearsal",
      title: "固定模拟排练",
      program_id: "linear",
      basis_sha256: p.programs[0].basis_sha256,
      snapshot: E.snapshot(p, "linear"),
      outcomes: [],
      declaration: "仅固定原创工程，不是真人排练。",
    },
    note: { ...p.notes[0], id: "temp-note" },
  };
}
export function changed(p: any) {
  return {
    action: "put_passage",
    field: "passage",
    value: {
      ...p.passages[1],
      objective: "保留迟疑，再由守站人提出共同出发。",
    },
  };
}
export async function refix(c: any, r: any, key: string) {
  const program = r.object.content.programs[0],
    d = await c.invoke("program_basis", {
      ...selection(r),
      items: program.items,
    });
  return c.invoke("put_program", {
    ...base(r, key),
    program: { ...program, basis_sha256: d.basis_sha256 },
  });
}
