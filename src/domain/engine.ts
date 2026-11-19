import { canonical, requireValue as need } from "../../vendor/project-store.ts";
import {
  digest,
  find,
  ordered,
  unique,
  fixedHistory,
  checkNotes,
} from "./shared.ts";
const ratio = (n: bigint, d: bigint) => {
  let a = n,
    b = d;
  while (b) [a, b] = [b, a % b];
  const g = a || 1n;
  return {
    numerator: String(n / g),
    denominator: String(d / g),
    unit: "seconds",
  };
};
export function passageTime(passage: any) {
  return passage.kind === "song"
    ? passage.bpm === null
      ? null
      : ratio(BigInt(passage.ticks) * 60n, 960n * BigInt(passage.bpm))
    : passage.estimate_ms === null
      ? null
      : ratio(BigInt(passage.estimate_ms), 1000n);
}
export function repriseBasis(
  p: any,
  motifID: string,
  originID: string,
  returnID: string,
) {
  return digest({
    motif: find(p.motifs, motifID),
    origin: find(p.passages, originID),
    return: find(p.passages, returnID),
  });
}
export function programBasis(p: any, items: any[]) {
  const ids = new Set(items.map((i) => i.passage_id));
  return digest({
    items: ordered(items),
    passages: ordered(items).map((i) => find(p.passages, i.passage_id)),
    scenes: ordered(items).map((i) =>
      find(p.scenes, find(p.passages, i.passage_id).scene_id),
    ),
    characters: p.characters,
    reprises: p.reprises.filter(
      (r: any) => ids.has(r.origin_passage_id) || ids.has(r.return_passage_id),
    ),
    motifs: p.motifs,
  });
}
export function programView(p: any, id: string) {
  const program = find(p.programs, id),
    seen = new Set<string>(),
    warnings: any[] = [];
  let n = 0n,
    d = 1n,
    known = true;
  const items = ordered(program.items).map((i) => {
    const passage = find(p.passages, i.passage_id),
      time = passageTime(passage);
    if (time) {
      const a = BigInt(time.numerator),
        b = BigInt(time.denominator);
      n = n * b + a * d;
      d *= b;
      const r = ratio(n, d);
      n = BigInt(r.numerator);
      d = BigInt(r.denominator);
    } else known = false;
    const gap = BigInt(i.gap_ms);
    n = n * 1000n + gap * d;
    d *= 1000n;
    const r = ratio(n, d);
    n = BigInt(r.numerator);
    d = BigInt(r.denominator);
    for (const r of p.reprises.filter(
      (r: any) => r.return_passage_id === passage.id,
    ))
      if (!seen.has(r.origin_passage_id))
        warnings.push({
          occurrence_id: i.id,
          reprise_id: r.id,
          kind: "origin_not_previously_performed",
        });
    seen.add(passage.id);
    return {
      occurrence: i,
      passage,
      scene: find(p.scenes, passage.scene_id),
      estimated_time: time,
    };
  });
  return {
    program,
    items,
    warnings,
    stale: program.basis_sha256 !== programBasis(p, program.items),
    estimated_time: known ? ratio(n, d) : null,
    note: "估时使用明确节拍或声明，不证明真实演出时长。",
  };
}
export function snapshot(p: any, id: string) {
  return {
    characters: structuredClone(p.characters),
    scenes: structuredClone(p.scenes),
    passages: structuredClone(p.passages),
    motifs: structuredClone(p.motifs),
    reprises: structuredClone(p.reprises),
    program: structuredClone(find(p.programs, id)),
  };
}
export function targetDigest(p: any, k: string, id: string): string {
  if (k === "scene") return digest(find(p.scenes, id));
  if (k === "passage") {
    const x = find(p.passages, id);
    return digest({
      passage: x,
      scene: find(p.scenes, x.scene_id),
      characters: p.characters.filter((c: any) =>
        x.lines.some((l: any) => l.speaker_ids.includes(c.id)),
      ),
    });
  }
  if (k === "reprise") {
    const x = find(p.reprises, id);
    return digest({
      reprise: x,
      current_basis: repriseBasis(
        p,
        x.motif_id,
        x.origin_passage_id,
        x.return_passage_id,
      ),
    });
  }
  need(k === "program", "未知意见目标。");
  const x = find(p.programs, id);
  return digest({ program: x, current_basis: programBasis(p, x.items) });
}
export function validateDomain(p: any) {
  unique(
    p.scenes.map((s: any) => s.order),
    "场景顺序重复。",
  );
  for (const x of [...p.scenes, ...p.characters, ...p.passages])
    x.evidence_ids.forEach((id: string) => find(p.evidence, id));
  for (const x of p.passages) {
    find(p.scenes, x.scene_id);
    unique(
      x.lines.map((l: any) => l.id),
      "段落行ID重复。",
    );
    need(x.lines.length > 0, "段落须有正文。");
    for (const l of x.lines) {
      unique(l.speaker_ids, "同一行演唱者重复。");
      l.speaker_ids.forEach((id: string) => find(p.characters, id));
      if (x.kind === "song")
        need(
          l.speaker_ids.length > 0 &&
            Number.isInteger(l.start_tick) &&
            Number.isInteger(l.end_tick) &&
            l.start_tick >= 0 &&
            l.end_tick > l.start_tick &&
            l.end_tick <= x.ticks,
          "唱段逐行须有演唱者和有效节拍范围。",
        );
      else
        need(
          l.start_tick === null && l.end_tick === null,
          "对白和过渡不使用歌曲节拍。",
        );
    }
    need(
      x.kind === "song"
        ? Number.isInteger(x.ticks) && x.estimate_ms === null
        : x.ticks === null && x.bpm === null,
      "歌曲使用节拍与BPM，对白使用独立声明估时。",
    );
    if (x.kind === "song")
      for (const singer of p.characters) {
        const lines = x.lines
          .filter((l: any) => l.speaker_ids.includes(singer.id))
          .sort((a: any, b: any) => a.start_tick - b.start_tick);
        for (let n = 1; n < lines.length; n++)
          need(
            lines[n].start_tick >= lines[n - 1].end_tick,
            "同一人物唱词时间重叠；多人并唱使用不同人物。",
          );
      }
  }
  for (const r of p.reprises) {
    find(p.motifs, r.motif_id);
    find(p.passages, r.origin_passage_id);
    find(p.passages, r.return_passage_id);
    need(
      r.origin_passage_id !== r.return_passage_id,
      "主题再现须关联不同段落。",
    );
  }
  for (const x of p.programs) {
    unique(
      x.items.map((i: any) => i.id),
      "出场ID重复。",
    );
    unique(
      x.items.map((i: any) => i.order),
      "出场顺序重复。",
    );
    x.items.forEach((i: any) => find(p.passages, i.passage_id));
  }
  for (const r of p.rehearsals) {
    const v = {
      ...p,
      ...r.snapshot,
      programs: [r.snapshot.program],
      rehearsals: [],
      notes: [],
    };
    validateDomain(v);
    need(
      r.program_id === r.snapshot.program.id &&
        r.basis_sha256 === programBasis(v, r.snapshot.program.items) &&
        r.snapshot.program.basis_sha256 === r.basis_sha256,
      "排练快照依据不符。",
    );
    unique(
      r.outcomes.map((x: any) => x.occurrence_id),
      "出场手记重复。",
    );
    let last = -1;
    for (const o of r.outcomes) {
      find(r.snapshot.program.items, o.occurrence_id);
      need(o.at_ms >= last, "排练手记时间倒置。");
      last = o.at_ms;
    }
  }
  checkNotes(p, (k, id) => targetDigest(p, k, id));
}
export function validateTransition(p: any, old?: any, _action?: string) {
  fixedHistory(p, old, ["evidence", "rehearsals"]);
  for (const x of p.reprises) {
    const prev = old?.reprises.find((r: any) => r.id === x.id);
    if (!prev || canonical(prev) !== canonical(x))
      need(
        x.basis_sha256 ===
          repriseBasis(p, x.motif_id, x.origin_passage_id, x.return_passage_id),
        "新主题再现依据不符。",
        "hetu.stale_evidence",
      );
  }
  for (const x of p.programs) {
    const prev = old?.programs.find((r: any) => r.id === x.id);
    if (!prev || canonical(prev) !== canonical(x))
      need(
        x.basis_sha256 === programBasis(p, x.items),
        "新编排依据不符。",
        "hetu.stale_evidence",
      );
  }
  for (const r of p.rehearsals)
    if (!old?.rehearsals.some((x: any) => x.id === r.id)) {
      need(
        canonical(r.snapshot) === canonical(snapshot(p, r.program_id)),
        "新排练须固定当前完整工程。",
      );
      need(
        !programView(p, r.program_id).stale,
        "旧编排须先复核。",
        "hetu.stale_evidence",
      );
      need(
        check(p).stale_reprise_ids.length === 0,
        "主题再现须先复核后建立新排练。",
        "hetu.stale_evidence",
      );
    }
  for (const x of p.notes) {
    const prev = old?.notes.find((r: any) => r.id === x.id);
    if (
      !prev ||
      canonical([prev.target_kind, prev.target_id, prev.target_sha256]) !==
        canonical([x.target_kind, x.target_id, x.target_sha256])
    )
      need(
        x.target_sha256 === targetDigest(p, x.target_kind, x.target_id),
        "新意见摘要不符。",
      );
  }
}
export function check(p: any) {
  return {
    stale_reprise_ids: p.reprises
      .filter(
        (r: any) =>
          r.basis_sha256 !==
          repriseBasis(p, r.motif_id, r.origin_passage_id, r.return_passage_id),
      )
      .map((r: any) => r.id),
    stale_program_ids: p.programs
      .filter((r: any) => r.basis_sha256 !== programBasis(p, r.items))
      .map((r: any) => r.id),
    stale_note_ids: p.notes
      .filter(
        (r: any) =>
          r.target_sha256 !== targetDigest(p, r.target_kind, r.target_id),
      )
      .map((r: any) => r.id),
    unknown_time_passage_ids: p.passages
      .filter((r: any) => passageTime(r) === null)
      .map((r: any) => r.id),
    programs: p.programs.map((r: any) => ({
      id: r.id,
      warnings: programView(p, r.id).warnings,
    })),
    note: "再现先后只检查明确关系，不裁定音乐或戏剧品质。",
  };
}
export function reading(p: any) {
  return (
    p.title +
    "\n\n" +
    p.programs
      .map((program: any) => {
        const v = programView(p, program.id);
        return (
          program.title +
          (v.stale ? "〔依据变化，待复核〕" : "") +
          "\n" +
          program.rationale +
          "\n\n" +
          v.items
            .map(
              (x) =>
                x.occurrence.order +
                ". " +
                x.scene.title +
                " / " +
                x.passage.title +
                " [" +
                x.passage.kind +
                "]\n戏剧目标：" +
                x.passage.objective +
                "\n" +
                x.passage.lines
                  .map(
                    (l: any) =>
                      (l.speaker_ids
                        .map((id: string) => find(p.characters, id).name)
                        .join("、") || "舞台行动") +
                      "：" +
                      l.text,
                  )
                  .join("\n"),
            )
            .join("\n\n")
        );
      })
      .join("\n\n")
  );
}
