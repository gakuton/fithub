#!/usr/bin/env bash
# PR作成前の自動チェック。失敗したらPR作成をブロックする。

ERRORS=()
REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ENV_FILE="$REPO/.env.local"

# 1. 必須 env vars の .env.local 存在確認
for VAR in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY TURSO_DATABASE_URL TURSO_AUTH_TOKEN ANTHROPIC_API_KEY; do
  if ! grep -q "^${VAR}=.\+" "$ENV_FILE" 2>/dev/null; then
    ERRORS+=("${VAR} が .env.local に未設定")
  fi
done

cd "$REPO"

# 2. TypeScript 型チェック
TSC="$REPO/node_modules/.bin/tsc"
if [ -f "$TSC" ]; then
  if ! "$TSC" --noEmit 2>/dev/null; then
    ERRORS+=("TypeScript エラーあり")
  fi
fi

# 3. ビルドチェック
if [ -f "$REPO/package.json" ]; then
  if ! npm run build 2>/dev/null; then
    ERRORS+=("ビルドエラーあり")
  fi
fi

# 結果を JSON で出力
if [ ${#ERRORS[@]} -gt 0 ]; then
  MSG=$(printf '%s; ' "${ERRORS[@]}"); MSG="${MSG%; }"
  jq -cn --arg msg "PR作成ブロック: ${MSG} — 修正後に /deploy-checklist を実行してください" \
    '{"continue": false, "stopReason": $msg}'
else
  echo '{"continue": true}'
fi
