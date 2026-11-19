# 操作地图

由正式清单生成，执行前发现当前安装版Schema。

| 动作 | 用途 | 必填参数 | 效果 |
| --- | --- | --- | --- |
| list_projects | 查找专业工程 |  | read |
| get_project | 读取固定专业工程 | object_id | read |
| save_project | 保存完整专业工程 | expected_revision, expected_sha256, operation_key, content | managed_write |
| get_source | 分块读取固定来源 | object_id, source_index | read |
| get_basis | 读取固定专业依据 | object_id, basis_index | read |
| compare_versions | 比较固定专业修订 | object_id, from_revision, to_revision | read |
| export_project | 分块导出完整专业数据 | object_id, format | read |
| build_context | 准备有界创作上下文 | object_id, goal, max_chars | read |
| create_handoff | 准备本工程AI接续 | object_id, goal | read |
| get_operation | 回读原操作 | operation_key | read |
| put_evidence | 维护固定引文 | object_id, expected_revision, expected_sha256, operation_key, evidence | managed_write |
| put_character | 维护演唱人物 | object_id, expected_revision, expected_sha256, operation_key, character | managed_write |
| remove_character | 移除演唱人物 | object_id, expected_revision, expected_sha256, operation_key, character_id | managed_write |
| put_scene | 维护场次 | object_id, expected_revision, expected_sha256, operation_key, scene | managed_write |
| remove_scene | 移除场次 | object_id, expected_revision, expected_sha256, operation_key, scene_id | managed_write |
| put_passage | 维护对白与唱段 | object_id, expected_revision, expected_sha256, operation_key, passage | managed_write |
| remove_passage | 移除对白与唱段 | object_id, expected_revision, expected_sha256, operation_key, passage_id | managed_write |
| put_motif | 维护音乐主题 | object_id, expected_revision, expected_sha256, operation_key, motif | managed_write |
| remove_motif | 移除音乐主题 | object_id, expected_revision, expected_sha256, operation_key, motif_id | managed_write |
| put_reprise | 维护主题再现 | object_id, expected_revision, expected_sha256, operation_key, reprise | managed_write |
| remove_reprise | 移除主题再现 | object_id, expected_revision, expected_sha256, operation_key, reprise_id | managed_write |
| put_program | 维护演出编排 | object_id, expected_revision, expected_sha256, operation_key, program | managed_write |
| remove_program | 移除演出编排 | object_id, expected_revision, expected_sha256, operation_key, program_id | managed_write |
| put_rehearsal | 维护固定排练 | object_id, expected_revision, expected_sha256, operation_key, rehearsal | managed_write |
| put_note | 维护固定意见 | object_id, expected_revision, expected_sha256, operation_key, note | managed_write |
| remove_note | 移除固定意见 | object_id, expected_revision, expected_sha256, operation_key, note_id | managed_write |
| target_digest | 读取目标固定摘要 | object_id, target_kind, target_id | read |
| check_musical | 检查专业关系与依据 | object_id | read |
| reprise_basis | 核对主题再现依据 | object_id, motif_id, origin_passage_id, return_passage_id | read |
| program_basis | 核对演出编排依据 | object_id, items | read |
| program_view | 读取完整音乐剧本 | object_id, program_id | read |
| compare_programs | 比较音乐剧编排 | object_id, from_id, to_id | read |
| rehearsal_view | 回读固定排练 | object_id, rehearsal_id | read |
| record_rehearsal | 固定完整排练快照 | object_id, expected_revision, expected_sha256, operation_key, program_id, record_id, title, outcomes, declaration | managed_write |
| export_reading | 导出专业阅读本 | object_id | read |
| export_review | 导出完整审核本 | object_id | read |
