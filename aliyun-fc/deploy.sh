#!/usr/bin/env bash
set -euo pipefail

required_env=(
  FEISHU_APP_ID
  FEISHU_APP_SECRET
  FEISHU_BITABLE_TOKEN
  FEISHU_TABLE_ID
  DECODE_TAG_TOKEN
  INTERVIEWER_MAP
)

missing=()
for key in "${required_env[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'Refusing to deploy: missing required env vars:\n' >&2
  printf '  - %s\n' "${missing[@]}" >&2
  printf '\nLoad the env vars first; otherwise Serverless Devs will deploy literal ${env.KEY} values.\n' >&2
  exit 1
fi

cd "$(dirname "$0")"
exec /opt/homebrew/opt/node@22/bin/node /opt/homebrew/lib/node_modules/@serverless-devs/s/bin/s deploy -y
