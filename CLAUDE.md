# FitHub 開発ガイド

## 仕様書
- Phase1 要求定義書: ../Phase1/要求定義書.html
- Phase1 アプリケーション仕様書: ../Phase1/アプリケーション仕様書.html
- Phase1 ビジネスレイヤー仕様書: ../Phase1/ビジネスレイヤー仕様書.html
- Phase1 設計ドキュメント: ../Phase1/設計ドキュメント.html
- Phase2 設計ドキュメント: ../Phase2/設計ドキュメント.html
- Phase3 設計ドキュメント: ../Phase3/設計ドキュメント.md
- Phase3.1 設計ドキュメント: ../Phase3.1/設計ドキュメント.md（体組成テーブル拡張 — **実装待ち**）
- Phase4 設計ドキュメント: ../Phase4/設計ドキュメント.md（マルチユーザー認証 — **実装待ち**）

## 技術スタック
Next.js 16 / TypeScript / Tailwind CSS / shadcn/ui / Drizzle ORM / SQLite(Turso) / TanStack Query v5 / Recharts / Zod

## 開発ルール
- コミットは feat: / fix: / chore: / style: / refactor: / db: のprefixを使う
- APIレスポンスは { data: T } または { error: string } の形式に統一する
- モバイルファースト設計（最小タップ領域 44px）

## 実装済み機能

### Phase1（トレーニング管理）
- ホーム画面：今日のセット一覧、テキスト出力（今日の記録）、食事サマリーカード、体組成サマリー
- 運動タブ（/history）：日付別・種目別トレーニング履歴
- 種目詳細（/exercise/[id]）：セット履歴テーブル、推定1RMグラフ、テキスト出力
- 体組成（/body）：体重・体脂肪率の記録・グラフ
- BottomNav：ホーム / 運動 / 食事 / 体組成

### Phase2（食事管理）
- 食事タブ（/meal）：週間ストリップ、日別詳細（朝食/昼食/夕食/その他）、PFCグラフ
- 食事CRUD：MealAddModal（連続入力UX）、編集・削除
- テキスト出力：日別・週別食事記録、今日の統合出力（トレーニング＋食事）

### Phase3（プロフィール機能）
- プロフィールページ（/profile）：デモグラフィック情報（性別・身長・生年月日・活動レベル）の閲覧・編集
- 目標管理：カテゴリ（減量/増量/現状維持）＋説明文、達成記録（confetti演出）、削除
- テキスト出力への付記：体組成＋プロフィールをテキスト末尾に追加（今日の記録・食事記録）
- ホーム画面右上にプロフィールへのリンクアイコン追加

## 実装予定

### Phase3.1（体組成テーブル拡張）— Issue #3
- `body_compositions` に `bmr`（基礎代謝・kcal）と `visceral_fat_index`（内臓脂肪指数）を追加
- Omron体組成計の実測値確認後に設計ドキュメントを更新してから実装
- PR-16：DBスキーマ＋マイグレーション
- PR-17：API＋UI（入力フォーム2項目追加）＋テキスト出力反映

### Phase4（マルチユーザー認証）— Issue #4
- Clerk（メール＋パスワード、自己サインアップ）
- 全ユーザー固有テーブルに `user_id` 追加
- APIルート全体に認証ガード適用
- PR-18〜PR-21

## DBスキーマ概要
- `exercises`：種目マスタ（name, category, isBodyweight）
- `workout_sets`：トレーニングセット（exerciseId, workoutDate, setNumber, weightKg, reps, estimated1rm）
- `meals`：食事レコード（mealDate, mealType）
- `meal_items`：食事アイテム（mealId, foodName, proteinG, fatG, carbG, kcal）
- `body_compositions`：体組成（measuredDate, weightKg, bodyFatPct, skeletalMuscleKg）※bmr・visceral_fat_index はPhase3.1で追加予定
- `demographic_data`：デモグラフィック（id='default', gender, heightCm, birthDate, activityLevel）
- `motivations`：目標（category, description, achievedAt）

## テキスト出力対象と付記データ
付記順：本文 → 最新の体組成 → プロフィール（デモグラ＋目標）

| 出力 | 体組成付記 | プロフィール付記 |
|------|-----------|----------------|
| 今日の記録（ホーム） | ✅ | ✅ |
| 食事記録・日別／週別 | ✅ | ✅ |
| 種目別記録（種目詳細） | ❌ | ❌ |
