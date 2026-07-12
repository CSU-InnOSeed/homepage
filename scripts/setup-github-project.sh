#!/usr/bin/env bash
# setup-github-project.sh
#
# 一键给 CSU-InnOSeed/homepage 仓库建好招新协作所需的:
#   - 全部 labels (类型 + 优先级 + 状态)
#   - 全部 milestones (招新阶段)
#
# Project 看板本身必须在 Web 端创建 (gh project create 不支持 --template),
# 脚本最后会打印入口链接。
#
# 用法:
#   1) gh auth login                       # 第一次用需先登录
#   2) gh auth refresh -s project,read:project  # 允许 gh 操作 Projects
#      (这一步会让浏览器跳出来, 确认授权; 没授权的话 gh issue edit --add-project 会报 'not found')
#   3) ./scripts/setup-github-project.sh   # 跑本脚本
#
# 安全: 脚本是幂等的, 已存在的 label 会用 --force 更新颜色/描述。
#       重新跑不会重复创建 milestone (gh milestone create 会失败 → 跳过)。

set -euo pipefail

REPO="CSU-InnOSeed/homepage"

# -------- 颜色 --------
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
NC=$'\033[0m'

info() { printf "${BLUE}[info]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[ ok ]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }
fail() { printf "${RED}[fail]${NC} %s\n" "$*" >&2; exit 1; }

# -------- 前置检查 --------
command -v gh >/dev/null 2>&1 || fail "gh CLI 未安装: brew install gh"
gh auth status >/dev/null 2>&1 || fail "未登录 gh CLI, 先跑: gh auth login"

info "目标仓库: $REPO"
gh repo view "$REPO" >/dev/null 2>&1 || fail "无访问权限或仓库不存在"

# -------- 1. Labels --------
# 格式: name|color|description
LABELS=(
  # 类型
  "招新|d73a4a|招新流程相关任务 (宣传/面试/录取)"
  "website|0075ca|官网维护 (代码/文案/视觉/数据)"
  "content|7057ff|文案 / 灵感"
  "bug|ee0701|网站 bug"
  "docs|0e8a16|文档相关"
  "interview|fbca04|面试相关 (文字需黑色)"
  # 优先级
  "P0|b60205|紧急 — 招新期间线上挂掉 / 截止日前必须完成"
  "P1|d93f0b|本周内 / 招新结束前"
  "P2|fbca04|有时间再说 (文字需黑色)"
  # 状态
  "blocked|cccccc|卡住等外部输入"
)

info "创建 / 更新 labels (共 ${#LABELS[@]} 个)..."
for entry in "${LABELS[@]}"; do
  IFS='|' read -r name color desc <<<"$entry"
  if gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" --force >/dev/null 2>&1; then
    ok "label: $name"
  else
    warn "label: $name (跳过, 创建失败)"
  fi
done

# -------- 2. Milestones --------
# 格式: title|description|due_on (ISO 8601 date)
# 默认日期基于 2026 暑期招新, 创建后请在 Web 端按真实节奏调整。
MILESTONES=(
  "招新启动|招新宣发正式启动, 公众号 + 朋友圈 + 群推|2026-07-20"
  "招新截止|报名通道关闭|2026-07-27"
  "一面|一面进行中|2026-08-03"
  "录取公布|录取名单发布 + 通知|2026-08-06"
)

info "创建 milestones (共 ${#MILESTONES[@]} 个)..."
for entry in "${MILESTONES[@]}"; do
  IFS='|' read -r title desc due <<<"$entry"
  if gh api "repos/$REPO/milestones" \
       -f title="$title" \
       -f description="$desc" \
       -f due_on="${due}T23:59:59Z" >/dev/null 2>&1; then
    ok "milestone: $title (DDL $due)"
  else
    warn "milestone: $title (跳过, 可能已存在 — 调 Web 端改 DDL)"
  fi
done

# -------- 3. Issue 模板已随仓库发布 --------
info "Issue 模板位置: .github/ISSUE_TEMPLATE/"
ls .github/ISSUE_TEMPLATE/*.yml 2>/dev/null | while read -r f; do
  ok "  - $f"
done

# -------- 4. Project 看板 (需手动) --------
cat <<EOF

${GREEN}========================================${NC}
${GREEN} GitHub Project 需要在 Web 端创建 ${NC}
${GREEN}========================================${NC}

gh CLI 当前版本不支持从模板创建 Project, 请在浏览器里点一下:

  1. 打开: ${BLUE}https://github.com/orgs/CSU-InnOSeed/projects${NC}
  2. 点 "New project"
  3. 模板选 ${YELLOW}"Automated kanban"${NC} (带自动归档)
  4. 标题: ${YELLOW}InnOSeed 招新 2026${NC}
  5. 可见性: Private (仅成员可见)
  6. 创建后, 到 Project 设置里:
     - "Manage access" → 把 repo 关联上
     - 描述里贴上链接: ${BLUE}.github/PROJECT_SETUP.md${NC}

完成后回到项目板, 把现有 issue 拖进 Todo 列, 开干。

详细使用说明: .github/PROJECT_SETUP.md
EOF
