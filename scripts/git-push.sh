#!/usr/bin/env bash
# Push using GITHUB_PAT from repo-root .env.git (never commit that file).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.git"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — create it with: GITHUB_PAT=your_token"
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${GITHUB_PAT:-}" ]]; then
  echo "GITHUB_PAT is empty in .env.git"
  exit 1
fi

REMOTE="${1:-origin}"
BRANCH="${2:-main}"
cd "$ROOT"

GIT_TERMINAL_PROMPT=0 git push "https://x-access-token:${GITHUB_PAT}@github.com/muazhazali/lepakmasjid.git" "${REMOTE}:${BRANCH}"