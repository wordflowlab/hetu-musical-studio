import { artifact } from "./artifact.ts";
import { find } from "./shared.ts";
import { requireValue as need } from "../../vendor/project-store.ts";
import * as E from "./engine.ts";
export { validateDomain, validateTransition } from "./engine.ts";
export async function checkSources(p: any, sources: any[], _request: any) {}
export async function pureAction(_a: string, _i: any) {
  return undefined;
}
export async function writeProfessional(
  a: string,
  p: any,
  _s: any[],
  i: any,
  ..._rest: any[]
) {
  if (a === "record_rehearsal") {
    const program = find(p.programs, i.program_id);
    need(
      !E.programView(p, program.id).stale &&
        E.check(p).stale_reprise_ids.length === 0,
      "编排或主题再现已过期。",
    );
    need(
      !p.rehearsals.some((x: any) => x.id === i.record_id),
      "排练ID已存在。",
    );
    p.rehearsals.push({
      id: i.record_id,
      title: i.title,
      program_id: program.id,
      basis_sha256: program.basis_sha256,
      snapshot: E.snapshot(p, program.id),
      outcomes: i.outcomes,
      declaration: i.declaration,
    });
    return;
  }

  throw Error("未知专业写动作。");
}
export function summaries(p: any) {
  return [
    { title: "完整专业阅读本", lines: [E.reading(p)] },
    { title: "检查与复核", lines: [JSON.stringify(E.check(p), null, 2)] },
    ...Object.entries(p)
      .filter(([k, v]) => Array.isArray(v))
      .map(([k, v]) => ({ title: k, lines: [JSON.stringify(v, null, 2)] })),
  ];
}
export async function readProfessional(
  a: string,
  p: any,
  _s: any[],
  i: any,
  _r: any,
) {
  if (a === "target_digest")
    return { target_sha256: E.targetDigest(p, i.target_kind, i.target_id) };
  if (a === "check_musical") return E.check(p);

  if (a === "reprise_basis")
    return {
      basis_sha256: E.repriseBasis(
        p,
        i.motif_id,
        i.origin_passage_id,
        i.return_passage_id,
      ),
    };
  if (a === "program_basis")
    return { basis_sha256: E.programBasis(p, i.items) };
  if (a === "program_view") return E.programView(p, i.program_id);
  if (a === "compare_programs")
    return { from: E.programView(p, i.from_id), to: E.programView(p, i.to_id) };
  if (a === "rehearsal_view")
    return { rehearsal: find(p.rehearsals, i.rehearsal_id) };

  if (a === "export_reading")
    return artifact(E.reading(p), "音乐剧工坊阅读本.txt", "text/plain", i);
  if (a === "export_review") {
    const { reportHTML } = await import("./report.ts");
    return artifact(
      reportHTML({ project: p }),
      "音乐剧工坊审核本.html",
      "text/html",
      i,
    );
  }
}
