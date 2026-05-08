---
description: FitHubのAPIルートがレスポンス形式ルール（{ data: T } または { error: string }）に準拠しているか確認する。APIルートを追加・変更した後に実行する。
argument-hint: [ファイルパス（省略時は全APIルートを対象）]
---

## 対象ファイルの特定

引数が指定されていれば $ARGUMENTS を対象にする。
省略された場合は以下のAPIルートファイルをすべて対象とする：

```
!`find app/api -name "route.ts" | sort`
```

## チェック項目

対象の各ルートファイルを読み、以下を確認して日本語で報告する。

### レスポンス形式
FitHubのルールは以下の2形式に統一：
- 成功時: `NextResponse.json({ data: ... })` または `new Response(...)` でストリーミング
- エラー時: `NextResponse.json({ error: string }, { status: N })`

以下は違反：
- `NextResponse.json([...])` （配列を直接返す）
- `NextResponse.json({ result: ... })` （`data` 以外のキー）
- `NextResponse.json({ message: ... })` （`error` 以外のキー）
- ステータスコードなしのエラーレスポンス

### その他
- `try/catch` による適切なエラーハンドリングがあるか
- Zodバリデーションを使っているか（外部入力を受けるルートのみ）
- `GET` ハンドラで `request` 引数を使わない場合に不要な引数を受け取っていないか

### 出力形式
違反があればファイル名・HTTPメソッド・問題箇所・修正案を表形式でまとめる。
違反がなければ「全ルート準拠」と簡潔に伝える。
