# 音乐剧工坊

> 把对白、歌曲段落、演唱角色、主题再现和排练手记组织成可继续改写的音乐剧。

## 简介

河图洛书的独立创作插件，由外部Codex通过河图CLI／MCP读取包内Skill并操作。歌词工坊拥有歌词精修与试听映射，舞台排演拥有部门提示调用，本包拥有戏剧与音乐段落的编排和再现关系。作曲、演唱合成、录音与现场执行由明确外部工具承担；不输出假声音或伪造真人排练。

## 角色分流

- 作者使用 → [插件中心](https://hetu.limeai.run/plugins/musical-studio/)
- Agent与功能Review → [功能清单](CAPABILITIES.md)
- 开发与维护 → [完整设计文档](docs/README.md)

## 快速上手

开发需要Node.js 25，安装与验收基线为河图0.12.6。

```bash
npm ci
npm run build
npm run check
npm run test:unit
npm run package
```

## 边界

专业成果沿固定来源与修订接续，正文采纳、定稿、费用和外发独立决定。发行及实际验收范围见[实施记录](docs/08-实施计划与验收记录.md)。
