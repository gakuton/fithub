# FitHub 開発ガイド

## 仕様書（../に配置）
- 要求定義書: ../要求定義書.html
- アプリケーション仕様書: ../アプリケーション仕様書.html
- ビジネスレイヤー仕様書: ../ビジネスレイヤー仕様書.html
- 設計ドキュメント: ../設計ドキュメント.html

## 技術スタック
Next.js 15 / TypeScript / Tailwind CSS / shadcn/ui / Drizzle ORM / SQLite(Turso) / TanStack Query v5 / Recharts / Zod

## 開発ルール
- コミットは feat: / fix: / chore: / style: / refactor: / db: のprefixを使う
- APIレスポンスは { data: T } または { error: string } の形式に統一する
- モバイルファースト設計（最小タップ領域 44px）
