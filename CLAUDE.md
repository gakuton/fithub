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
- Phase6 要求定義書: ./docs/Phase6/要求定義書.md（AIパーソナルトレーナーチャット — **要求定義完了・設計待ち**）

=======

## デザインシステム
- 概要・ルール: `./docs/design-system/README.md`
- CSSトークン（色・タイポ・スペーシング）: `./docs/design-system/colors_and_type.css`

### デザイン原則（要約）
- **ブランドカラー**: hue 277（indigo→violet）。`--primary: oklch(0.585 0.233 277.117)` ≈ `#6366f1`
- **ニュートラル**: グレーを使わない。全てhue 277の彩度を落としたもの
- **セマンティック色**: 体脂肪率→`text-orange-500`、骨格筋→`text-green-500`、有酸素→`sky-500`
- **フォント**: Geist（日本語フォールバック: Hiragino Sans → Noto Sans JP）
- **カード角丸**: `rounded-2xl`（21.6px）。ボタン・入力: `rounded-lg` / `rounded-xl`
- **シャドウ**: `shadow-sm` のみ、最小限に
- **アイコン**: `lucide-react` のみ。stroke 1.8デフォルト、アクティブ時 2.5
- **絵文字・画像・グラデーション**: 使用禁止（ロゴのみ例外）
- **コピーライティング**: 日本語のみ。感嘆符なし、二人称なし、静かで宣言的なトーン
- **モバイルファースト**: `max-w-lg`（32rem）上限、タップ領域44px以上、`pb-20`でBottomNav分を確保

## 技術スタック
Next.js 16 / TypeScript / Tailwind CSS / shadcn/ui / Drizzle ORM / SQLite(Turso) / TanStack Query v5 / Recharts / Zod

## 開発ルール
- コミットは feat: / fix: / chore: / style: / refactor: / db: のprefixを使う
- APIレスポンスは { data: T } または { error: string } の形式に統一する
- モバイルファースト設計（最小タップ領域 44px）

## 本番デプロイ原則（必ず遵守）

### マージ禁止条件
以下が揃っていない状態でのmainへのマージは禁止。PRを作成する前に `/deploy-checklist` を必ず実行すること。

1. **env vars が Vercel に設定済みであること** — コードが必要とする環境変数が本番に存在しない状態でのデプロイは全画面500エラーになる
2. **DBマイグレーションがコードより先か同時に適用済みであること** — コードが先にデプロイされると新カラム参照で500エラーになる
3. **PRの説明に「マージ後に実施」という手順が残っていないこと** — 「後でやる」はやらない。先に完了させてからマージする

### 外部サービスを新規追加する場合の順序
```
1. 外部サービスでAPIキー・プロジェクトを作成する
2. Vercel に env vars を設定する
3. ローカルの .env.local を更新する
4. コードを実装・PRを作成する
5. マージする
```
コードより先にインフラを整える。この順序は変えない。

### DBスキーマ変更の順序（破壊的変更を避ける）
```
Step 1: nullable または DEFAULT 付きで新カラムを追加するマイグレーションを本番適用
Step 2: 新カラムを使うコードをデプロイ
Step 3: （不要になった旧カラムは後日削除）
```
コードと同じPRでマイグレーションを入れる場合も、マイグレーション適用がVercelのデプロイより論理的に先になるよう設計すること。

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

### Phase6（AIパーソナルトレーナーチャット）— 要求定義完了
- アプリ内AIチャット（`/chat`）。BottomNavに5番目タブ「AI」を追加
- 直近30日（デフォルト）のトレーニング・食事・体組成・目標を自動コンテキストとしてClaude APIへ送信
- ユーザーの質問内の期間キーワード（「半年」「今週」等）を解析し参照期間を動的決定
- 会話履歴はlocalStorageに当日分を保持（翌日リセット）
- 要求定義書: `./docs/Phase6/要求定義書.md`

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
