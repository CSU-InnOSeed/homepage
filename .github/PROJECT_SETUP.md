# 招新项目板使用说明

> 这份文档给 InnOSeed 的所有成员看 —— 招新期间（以及平时维护官网）的所有协作都在 GitHub 上发生。

## 一张图看懂结构

```
   Issue  ←───  招新待办 / 网站修改 / Bug 报告 / 文案灵感
     │
     ├──  Labels:  招新 / website / content / P0 / P1 / P2 / blocked
     ├──  Milestone:  招新启动 / 一面 / 录取公布
     └──  Project:   招新 2026 (看板: Todo / In Progress / Done)
```

每条具体的事 = 一个 **Issue**。项目板 = 所有 Issue 的看板视图。Milestone = 阶段截止日期。Label = 分类。

---

## 怎么开一条新任务

1. 进仓库 → **Issues** → **New issue**
2. 根据类型选模板：
   - **招新待办** — 招新流程、宣传、面试跟进
   - **网站修改** — 官网的代码、文案、视觉、数据
   - **文案 / 内容想法** — 灵感，还没成型
   - **Bug 报告** — 网站挂了
   - 都不合适 → 选 **Open a blank issue**
3. 填完模板提交 — 标题会自动带前缀（`[招新]` / `[网站]` …）
4. 提交后到 **Project board** 把卡片拖到对应列
5. 自己能解决的指给自己 (`assignee`)，需要别人帮忙的留空并在群里 @ 人

---

## 项目板 (Project) 怎么用

看板地址: https://github.com/orgs/CSU-InnOSeed/projects *(具体链接看实际项目)*

| 列 | 含义 |
|---|---|
| **Todo** | 待开始 |
| **In Progress** | 正在做 |
| **Done** | 完成 (卡片 14 天后自动归档) |

**日常节奏:**
- 每天开站看一眼 Todo 列 — 有没有卡住自己的 (`blocked` label)
- 自己的活做完了从 In Progress 拖到 Done
- 招新冲刺期（招新启动前 1 周、一面前、录取前）建议每天站会同步 5 分钟

---

## Label 体系

### 任务类型
| Label | 含义 | 颜色 |
|---|---|---|
| `招新` | 招新流程相关 | 红 `#d73a4a` |
| `website` | 官网维护 | 蓝 `#0075ca` |
| `content` | 文案 / 灵感 | 紫 `#7057ff` |
| `bug` | 网站 bug | 红 `#ee0701` |
| `docs` | 文档 | 浅蓝 `#0e8a16` |
| `interview` | 面试相关 | 橙 `#fbca04` (文字黑) |

### 紧急程度
| Label | 含义 |
|---|---|
| `P0` | 紧急 (招新期间线上挂掉 / 一面前必须完成) |
| `P1` | 本周内 / 招新结束前 |
| `P2` | 有时间再说 |

### 状态
| Label | 含义 |
|---|---|
| `blocked` | 卡住等外部输入 (在群里说一声) |

---

## Milestone (招新阶段)

| Milestone | 含义 | 默认 DDL |
|---|---|---|
| 招新启动 | 招新宣发正式启动 | 招新前 ~10 天 |
| 招新截止 | 报名通道关闭 | 招新日 |
| 一面 | 一面进行中 | 招新日 + 1 周 |
| 录取公布 | 录取名单发布 | 一面后 ~3 天 |

> ⚠️ 上面 DDL 是**默认值**，具体日期在 milestone 描述里改。

每个 issue 挂一个 milestone —— milestone 页面就是这个阶段的进度条。

---

## 一些约定

- **标题** 用动词开头：「补 24 级招新问答」/「修移动端 manifesto 字号」
- **一个 issue 一件事** — 别把「修 BUG + 写推文」塞一起
- **完成就关** — 做完从 project 拖到 Done，issue 同步 close，**不要拖回去**
- **自己认领自己** — 没人指派的活谁先动手就 assignee 填自己
- **卡住就标 blocked** — 别默默卡着，在群里说一声 + label 改 `blocked`

---

## 给维护者的初始化命令

第一次用这套流程？在 `innoseed-landing` 仓库根目录跑：

```bash
# 1. 登录 gh CLI (只需一次)
gh auth login

# 2. 跑一键 setup 脚本 (建 labels + milestones)
./scripts/setup-github-project.sh

# 3. 在 Web 端建 Project:
#    https://github.com/orgs/CSU-InnOSeed/projects
#    → New project → Template 选 "Automated kanban"
#    → 标题: "InnOSeed 招新 2026"
```

详细参数看脚本注释。
