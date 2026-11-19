import React, { useState } from "react";
import { useProfessionalReport } from "./professional-state.ts";
import {
  FixedNotes,
  Delivery,
  targetsOf,
  sorted,
} from "./professional-parts.tsx";
const kinds: any = { song: "歌曲", dialogue: "对白", transition: "过渡" };
export function ProfessionalView(props: any) {
  const { p, tab, run, show, write, invoke, selection } = props,
    { report, error } = useProfessionalReport(props, "check_musical"),
    [chosen, setChosen] = useState("");
  const program = p.programs.find((x: any) => x.id === chosen) ?? p.programs[0],
    person = (id: string) => p.characters.find((x: any) => x.id === id)?.name,
    passage = (id: string) => p.passages.find((x: any) => x.id === id);
  const picker = program && (
    <label>
      当前编排
      <select
        aria-label="当前编排"
        value={program.id}
        onChange={(e) => setChosen(e.target.value)}
      >
        {p.programs.map((x: any) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {tab === 0 && (
        <>
          {picker}
          <div className="work-layout">
            <div className="reading">
              {program ? (
                sorted(program.items).map((i: any) => {
                  const x = passage(i.passage_id);
                  return (
                    <section key={i.id}>
                      <h3>
                        {i.order}. {x.title}〔{kinds[x.kind]}〕
                      </h3>
                      <p className="annotation">
                        {p.scenes.find((s: any) => s.id === x.scene_id)?.title}
                        　戏剧目标：{x.objective}
                      </p>
                      {x.lines.map((l: any) => (
                        <p key={l.id}>
                          <strong>
                            {l.speaker_ids.map(person).join("、") || "舞台行动"}
                          </strong>
                          　{l.text}
                        </p>
                      ))}
                    </section>
                  );
                })
              ) : (
                <p>尚无演出编排。让AI从故事、对白和歌词依据准备。</p>
              )}
            </div>
            <aside className="side">
              <h3>本次音乐剧</h3>
              <p>{p.brief}</p>
              <p>{program?.rationale}</p>
              <p className="muted">
                {program && report?.stale_program_ids.includes(program.id)
                  ? "编排依据已变化，待复核"
                  : "对白、唱段和演唱分工分别保存"}
              </p>
            </aside>
          </div>
        </>
      )}
      {tab === 1 && (
        <>
          {p.passages.map((x: any) => (
            <article key={x.id}>
              <h3>
                {x.title}〔{kinds[x.kind]}〕
              </h3>
              <p>{x.objective}</p>
              {x.kind === "song" && (
                <>
                  <p>
                    {x.ticks}/960 四分音符拍　
                    {x.bpm === null ? "速度未知" : x.bpm + " BPM"}
                  </p>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>演唱者</th>
                          <th>进入—结束节拍</th>
                          <th>唱词</th>
                        </tr>
                      </thead>
                      <tbody>
                        {x.lines.map((l: any) => (
                          <tr key={l.id}>
                            <td>{l.speaker_ids.map(person).join("、")}</td>
                            <td>
                              {l.start_tick}—{l.end_tick} ticks
                            </td>
                            <td>{l.text}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <svg
                    className="singing-map"
                    viewBox="0 0 800 130"
                    role="img"
                    aria-label={x.title + " 演唱进入示意"}
                  >
                    {x.lines.map((l: any, n: number) => (
                      <g key={l.id}>
                        <text x="0" y={25 + n * 28}>
                          {l.speaker_ids.map(person).join("、")}
                        </text>
                        <rect
                          x={170 + (600 * l.start_tick) / x.ticks}
                          y={10 + n * 28}
                          width={Math.max(
                            1,
                            (600 * (l.end_tick - l.start_tick)) / x.ticks,
                          )}
                          height="16"
                          rx="2"
                        />
                      </g>
                    ))}
                  </svg>
                </>
              )}
              {x.kind !== "song" &&
                x.lines.map((l: any) => (
                  <p key={l.id}>
                    {l.speaker_ids.map(person).join("、")}：{l.text}
                  </p>
                ))}
            </article>
          ))}
        </>
      )}
      {tab === 2 && (
        <>
          {p.reprises.map((r: any) => (
            <article key={r.id}>
              <h3>{p.motifs.find((m: any) => m.id === r.motif_id)?.title}</h3>
              <p>
                {passage(r.origin_passage_id)?.title} →{" "}
                {passage(r.return_passage_id)?.title}
              </p>
              <p>{r.rationale}</p>
              <p
                className={
                  report?.stale_reprise_ids.includes(r.id) ? "warning" : "muted"
                }
              >
                {report?.stale_reprise_ids.includes(r.id)
                  ? "再现依据已变化，待复核"
                  : "明确主题再现关系"}
              </p>
            </article>
          ))}
          {picker}
          {program && (
            <>
              <div className="actions">
                <button
                  onClick={() =>
                    void run(() =>
                      show("program_view", { program_id: program.id }),
                    )
                  }
                >
                  核对顺序与精确估时
                </button>
                <button
                  disabled={p.programs.length < 2}
                  onClick={() =>
                    void run(() =>
                      show("compare_programs", {
                        from_id: program.id,
                        to_id: p.programs.find((x: any) => x.id !== program.id)
                          .id,
                      }),
                    )
                  }
                >
                  比较两种演出编排
                </button>
              </div>
              {report?.programs
                .find((x: any) => x.id === program.id)
                ?.warnings.map((w: any, n: number) => (
                  <p className="warning" key={n}>
                    主题回归前尚未演出原段：
                    {
                      p.reprises.find((r: any) => r.id === w.reprise_id)
                        ?.rationale
                    }
                  </p>
                ))}
            </>
          )}
        </>
      )}
      {tab === 3 && (
        <>
          {p.reprises
            .filter((x: any) => report?.stale_reprise_ids.includes(x.id))
            .map((r: any) => (
              <article key={r.id}>
                <p>主题再现待复核：{passage(r.return_passage_id)?.title}</p>
                <button
                  onClick={() =>
                    void run(async () => {
                      const d = await invoke("reprise_basis", {
                        ...selection(),
                        motif_id: r.motif_id,
                        origin_passage_id: r.origin_passage_id,
                        return_passage_id: r.return_passage_id,
                      });
                      await write("put_reprise", {
                        reprise: { ...r, basis_sha256: d.basis_sha256 },
                      });
                    })
                  }
                >
                  重新固定此主题再现
                </button>
              </article>
            ))}
          {picker}
          {program && (
            <div className="actions">
              <button
                onClick={() =>
                  void run(async () => {
                    const d = await invoke("program_basis", {
                      ...selection(),
                      items: program.items,
                    });
                    await write("put_program", {
                      program: { ...program, basis_sha256: d.basis_sha256 },
                    });
                  })
                }
              >
                重新固定所选编排
              </button>
              <button
                onClick={() =>
                  void run(() =>
                    write("record_rehearsal", {
                      program_id: program.id,
                      record_id: "rehearsal-" + crypto.randomUUID(),
                      title: "固定音乐剧排练依据",
                      outcomes: [],
                      declaration: "仅固定当前完整工程，尚未登记真人排练手记。",
                    }),
                  )
                }
              >
                固定排练快照
              </button>
            </div>
          )}
          {p.rehearsals.map((r: any) => (
            <article key={r.id}>
              <h3>{r.title}</h3>
              <p>{r.declaration}</p>
              <p>{r.outcomes.length} 条手记</p>
              <button
                onClick={() =>
                  void run(() => show("rehearsal_view", { rehearsal_id: r.id }))
                }
              >
                查看固定排练记录
              </button>
            </article>
          ))}
          <FixedNotes
            {...props}
            report={report}
            targets={targetsOf(p, {
              scene: "scenes",
              passage: "passages",
              reprise: "reprises",
              program: "programs",
            })}
          />
        </>
      )}
      {tab === 4 && (
        <Delivery
          {...props}
          check="check_musical"
          goal="按固定音乐剧编排、演唱分工及排练意见接续剧本、歌词或舞台制作，不覆盖上游正式成果。"
        />
      )}
    </>
  );
}
