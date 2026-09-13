#!/bin/bash
# 日常部署：本地 build → rsync 到 ECS → reload nginx
# 跑法：./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."  # project root

REMOTE="${REMOTE:-root@8.210.122.152}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
echo "==[1/3]== pnpm build"
pnpm build

echo
echo "==[2/3]== rsync dist/ (incremental, no --delete)"
rsync -avz \
    -e "ssh $SSH_OPTS" \
    --exclude '.DS_Store' \
    dist/ "$REMOTE:/var/www/innoseed/"

echo
echo "==[3/3]== cleanup macOS leftovers + reload"
ssh $SSH_OPTS "$REMOTE" '
  set +e
  find /var/www/innoseed/ -name ".DS_Store" -delete 2>/dev/null
  find /var/www/innoseed/ -type d \( -name ".omc" -o -name ".omx" \) -exec rm -rf {} + 2>/dev/null
  nginx -t 2>&1
  systemctl reload nginx 2>&1
  echo "reloaded at $(date -u +%FT%TZ)"
'

echo
echo "DONE. verify:"
echo "  curl -I https://innoseed.club/"
echo "  curl -I https://innoseed.club/apply"
