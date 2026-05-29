#!/bin/bash
set -e

pnpm install --frozen-lockfile=false

if [ -n "$GITHUB_TOKEN" ]; then
  REPO_URL="https://${GITHUB_TOKEN}@github.com/Akhil-A-21/ai-diary.git"
  git push --force "$REPO_URL" main
else
  echo "GITHUB_TOKEN not set — skipping GitHub push"
fi
