import assert from "node:assert/strict";
import { selection, base, changed, refix, reviewTarget } from "./scenario.ts";
export const readingAction = "export_reading";
export async function exercise(c: any, r: any, key: () => string) {
  let s = selection(r);
  await c.invoke("check_musical", s);
  await c.invoke("target_digest", {
    ...s,
    target_kind: reviewTarget.kind,
    target_id: reviewTarget.id,
  });

  const v = await c.invoke("program_view", { ...s, program_id: "linear" });
  assert.deepEqual(v.estimated_time, {
    numerator: "13",
    denominator: "2",
    unit: "seconds",
  });
  await c.invoke("program_basis", {
    ...s,
    items: r.object.content.programs[0].items,
  });
  const comparison = await c.invoke("compare_programs", {
    ...s,
    from_id: "linear",
    to_id: "alternate",
  });
  assert.equal(comparison.to.warnings.length, 1);
  const rp = r.object.content.reprises[0];
  await c.invoke("reprise_basis", {
    ...s,
    motif_id: rp.motif_id,
    origin_passage_id: rp.origin_passage_id,
    return_passage_id: rp.return_passage_id,
  });
  await c.invoke("rehearsal_view", { ...s, rehearsal_id: "temp-rehearsal" });
  r = await c.invoke("record_rehearsal", {
    ...base(r, key()),
    program_id: "linear",
    record_id: "rehearsal",
    title: "原创音乐剧手记",
    outcomes: [
      {
        occurrence_id: "b",
        at_ms: 5000,
        result: "unknown",
        comment: "仅保存声明，不是真人演唱",
      },
    ],
    declaration: "原创模拟排练手记，尚无现场执行或声音文件。",
  });
  const frozen = r.object.content.rehearsals.at(-1);
  const change = changed(r.object.content);
  r = await c.invoke(change.action, {
    ...base(r, key()),
    [change.field]: change.value,
  });
  assert.ok(
    (await c.invoke("check_musical", selection(r))).stale_program_ids.includes(
      "linear",
    ),
  );
  const current = r.object.content.reprises[0],
    basis = await c.invoke("reprise_basis", {
      ...selection(r),
      motif_id: current.motif_id,
      origin_passage_id: current.origin_passage_id,
      return_passage_id: current.return_passage_id,
    });
  r = await c.invoke("put_reprise", {
    ...base(r, key()),
    reprise: { ...current, basis_sha256: basis.basis_sha256 },
  });
  r = await refix(c, r, key());
  assert.ok(
    !(await c.invoke("check_musical", selection(r))).stale_program_ids.includes(
      "linear",
    ),
  );
  assert.deepEqual(r.object.content.rehearsals.at(-1), frozen);
  return r;
}
