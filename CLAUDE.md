# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 重要: Next.js 16 系を使用

このプロジェクトは Next.js 16.4 / React 19.3 で、学習データ上の Next.js とは API・規約が異なる可能性がある。コードを書く前に `node_modules/next/dist/docs/`（`01-app/` が App Router 用）の該当ガイドを読み、非推奨の記述に従うこと。上記 `AGENTS.md` は `next dev` が自動生成・再追加するファイルなので、削除せずそのままコミットしてよい。

## コマンド

```bash
npm run dev                 # 開発サーバー (http://localhost:3000)
npm run build               # 本番ビルド
npm run lint                # ESLint (flat config: eslint.config.mjs)
npx tsc --noEmit            # 型チェック
npm test                    # Vitest をウォッチモードで実行
npx vitest run              # 全テストを1回だけ実行
npx vitest run src/__tests__/page.test.tsx   # 単一ファイルを実行
npx vitest run -t "テスト名の一部"            # テスト名で絞り込み
```

## アーキテクチャと設定上の要点

- **App Router のみ**（`src/app/`）。パスエイリアスは `@/*` → `src/*`。
- **Cache Components が有効**（`next.config.ts` の `cacheComponents: true` + `partialPrefetching: true`）。データ取得はデフォルトで動的になり、キャッシュしたい箇所に `use cache` / `cacheLife` / `cacheTag` を明示する。この設定下ではルートセグメント設定の `runtime` export は使えない。旧来の `revalidate` / `dynamic` などのセグメント設定を書く前に `node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md` を確認すること。
- **Tailwind CSS v4 を Turbopack ローダー経由で処理**（`next.config.ts` の `turbopack.rules` で `*.css` に `@tailwindcss/turbopack` を適用）。PostCSS 設定ファイルは存在しない。テーマトークン（`--color-background` / `--color-primary` 等、shadcn/ui の CSS 変数）は `src/app/globals.css` の `@theme inline` で定義（詳細は下記「UI コンポーネント（shadcn/ui）」）。
- `layout.tsx` などで使う `LayoutProps<"/">` / `PageProps` はグローバル型ヘルパー（Next.js が `.next/types` に生成）で、import 不要。

## ディレクトリ構成

- `src/app/` … ルート（`page.tsx`）と Server Actions（`actions.ts`）
- `src/components/` … UI コンポーネント。データ取得を担う async Server Component（`TaskBoardSection`）と、操作を担う Client Component（`TaskBoard` / `TaskCard` / `ConfirmDialog`）を分ける
- `src/components/ui/` … shadcn/ui の CLI で追加したコンポーネント（button / card / input / textarea / label / native-select / badge / alert / alert-dialog / skeleton）
- `src/lib/utils.ts` … shadcn/ui のユーティリティ。`cn` パッケージの `cn` を再エクスポートしているだけ
- `src/lib/supabase/` … Supabase クライアント・環境変数・DB 型・接続確認
- `src/lib/tasks/` … タスクのドメイン層（型 `types.ts`、検証 `validation.ts`、取得 `queries.ts`）。UI や Next.js に依存しない純粋なコードを置く

## UI コンポーネント（shadcn/ui）

- 設定は `components.json`（style `base-nova`、baseColor `neutral`、CSS 変数あり、アイコンは `lucide-react`）。コンポーネントは `npx shadcn@latest add <name>` で `src/components/ui/` に追加する。CLI の挙動は変化が速いので、追加・移行の前に Context7 で最新ドキュメントを確認する。
- 土台は **Radix ではなく Base UI**（`@base-ui/react`、2026年7月以降の shadcn の既定）。Radix 前提の API（`asChild` 等）は使えず、要素の差し替えは `render` prop で行う。
- `cn` は `clsx` + `tailwind-merge` ではなく shadcn 公式の `cn` パッケージ（2026年9月以降の既定）。`@/lib/utils` からでも `cn` からでも import できる。
- ボタンは素の `<button>` ではなく `@/components/ui/button` の `Button` を使い、見た目は `variant`（`default` / `outline` / `ghost` / `destructive` 等）と `size`（`xs` / `sm` / `default` / `lg` 等）で指定する。`className` での色指定は最小限にする。
- Base UI の `Button` は既定で `type="button"` を付ける。フォーム送信ボタンには `type="submit"` を明示すること（渡した props が優先される）。
- `src/components/ui/` は CLI が生成するファイルで、プロジェクトのコードスタイルと異なりセミコロン無しだが、そのままでよい。
- ダークモードは `globals.css` の `@custom-variant dark (&:is(.dark *))` により **`.dark` クラス方式**。現状どこでも `.dark` を付けていないため、`dark:` クラスは効かず常にライト表示になる。
- `globals.css` の `--font-sans` は `layout.tsx` の Geist 変数（`--font-geist-sans`）を参照している。`shadcn init` を再実行すると `var(--font-sans)` という自己参照に書き換えられてフォントが効かなくなるので、実行後に確認する。
- UI はすべて shadcn/ui のコンポーネントとテーマトークン（`bg-muted` / `text-muted-foreground` 等）で組んでいる。`zinc-*` などの色を直接書かない（例外は列見出しのステータス色ドット）。
- ステータスの選択は `NativeSelect`（中身は `<select>`）を使う。Base UI の `Select` は `<select>` を出さず、テストの `getByLabelText<HTMLSelectElement>` + `fireEvent.change` や FormData の扱いが変わるため。
- 削除確認の `AlertDialog` は呼び出し側で条件付きレンダーし、`open` 固定で描画する（閉じた瞬間にアンマウントされるため、テストで同期的に消えたことを確認できる）。
- `Alert` は自身が `role="alert"` を持つ。テストは `textContent` の完全一致で確認しているので、`AlertTitle` など文字を持つ要素を足さない。

## デザインルール

見た目を変える・UI を足すときは以下に揃える。迷ったら既存の `TaskBoard` / `TaskCard` / `page.tsx` を手本にする。

- **色**: shadcn のテーマトークン（`bg-card` / `bg-muted` / `text-muted-foreground` / `border` / `text-destructive` 等）だけを使い、Tailwind のパレット色（`zinc-*` / `red-*` 等）や `dark:` での個別指定は書かない。トークン経由にしておけば `.dark` 導入時にそのまま対応できる。唯一の例外はステータスの識別色で、`TaskBoard` の `statusAccent`（未着手 slate / 進行中 blue / 完了 emerald）に集約し、小さなドットにだけ使う。
- **面の階層**: ページ背景 `bg-muted/30`（`layout.tsx`）→ 列などのグループ `rounded-xl border bg-muted/50` → 操作対象のまとまり（追加フォーム・タスク）は `Card`（白・`ring` の細い枠）。影は付けず、カードのホバー時だけ `hover:shadow-md`。空の状態は `border-dashed` の枠に `text-muted-foreground` の中央寄せ文言。
- **角丸**: 囲み（列・カード・スケルトン）は `rounded-xl`、入力欄・ボタンは各コンポーネントの既定（`rounded-lg`）のまま変えない。
- **余白とレイアウト**: `main` は `max-w-6xl px-4 py-8 sm:py-12`。セクション間は `gap-6`、グループ内は `gap-3`（グリッドは `gap-4`）、ラベルと入力欄は `flex flex-col gap-1.5`。モバイルファーストで、横並びは `sm:` / `md:` 以上で行う（列は `md:grid-cols-3`、追加フォームは `sm:flex-row`）。
- **文字**: ページ見出し h1 は `text-2xl font-semibold tracking-tight`、列見出し h2 は `text-sm font-semibold`、補足文は `text-sm text-muted-foreground`。件数などの数値は `tabular-nums`。
- **ボタンの使い分け**: 画面の主操作（追加・保存）は `default`、取り消しは `outline`、カード内の操作は `ghost` + `size="icon-xs"` のアイコンのみ、破壊的操作の確定は `destructive`。主操作のボタンは1つの領域に1つまで。
- **アイコン**: `lucide-react` のみ。文字付きボタンのアイコンは `data-icon="inline-start"` を付けて先頭に置く。アイコンのみのボタンは必ず `aria-label`（テストが参照する名前）を付け、装飾用アイコンは `aria-hidden="true"`。
- **高さを揃える**: 入力欄・ボタン・セレクトは既定の `h-8` で揃える。1行の `Textarea` を横に並べるときは `min-h-8 resize-none py-[5px]` で `Input` と同じ高さにし、横並びフォームは `sm:items-start` + ボタンに `sm:mt-5`（ラベル分）で上端を合わせる。
- **状態の見せ方**: 読み込み中は実際のレイアウトをなぞった `Skeleton` と `sr-only` の文言、エラーは `Alert variant="destructive"` + `CircleAlert`、保存待ちは `opacity-60` + `Loader2` の `animate-spin`、編集中のカードは `ring-2 ring-ring/40`。確認が必要な操作は `AlertDialog`。
- **確認**: 見た目を変えたら Playwright MCP で 1280px と 390px の幅のスクリーンショットを撮り、崩れ・ずれ・コンソールエラーがないことを確かめる。スクリーンショットは `.playwright-mcp/` に保存する。

## Supabase

- プロジェクト: `task-kanban`（project ref `cosamtpchnabbyoycxqj`、リージョン eu-west-3）。テーブル構成・キー・ログは Supabase MCP（`list_tables` / `get_publishable_keys` / `query_logs` 等）で確認する。
- 環境変数は `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` の2つ（キー一覧は `.env.example`、実値は git 管理外の `.env.local`）。旧来の `ANON_KEY` ではなく publishable key（`sb_publishable_...`）を使う。値の読み込みは `src/lib/supabase/env.ts` に集約しており、`process.env` を直接読まない。
- パッケージは `@supabase/supabase-js` + `@supabase/ssr`。クライアントは用途で使い分ける:
  - Client Component → `src/lib/supabase/client.ts` の `createClient()`（同期）
  - Server Component / Server Action / Route Handler → `src/lib/supabase/server.ts` の `createClient()`（`async`。`cookies()` を使うため `await` が必要で、リクエストごとに生成する。モジュールスコープで使い回さない）
  - 現状 DB アクセスはすべてサーバー側（`queries.ts` / `actions.ts`）で行っており、ブラウザ用クライアントは未使用。
- サーバー起動時の接続確認は `src/instrumentation.ts`（Next.js の `register()`、Node.js ランタイムのみ）で `checkSupabaseConnection()`（`src/lib/supabase/checkConnection.ts`）を呼ぶ。Auth の `/auth/v1/health` への疎通確認で、失敗時のみ `console.error` を出す。成功時はログを出さない。

### スキーマとマイグレーション

- **マイグレーションはリポジトリに無く、Supabase 側の履歴だけが正**（ローカルに `supabase/` ディレクトリや Supabase CLI は無い）。適用済みの一覧は MCP の `list_migrations` で確認する。現在は `create_tasks_table` の1件。
- スキーマ変更の手順: `list_tables(verbose)` で現状確認 → `apply_migration`（snake_case の名前を付ける）→ `get_advisors(security / performance)` → `generate_typescript_types` の出力で `src/lib/supabase/database.types.ts` を丸ごと置き換える → アプリ側の型・検証・テストを追従させる。本番 DB に直接適用されるので、破壊的変更（列削除など）は事前にユーザーに確認する。
- `public.tasks` の列: `id`（uuid, `gen_random_uuid()`）/ `title`（trim 後 1〜100文字）/ `description`（既定 `''`、1000文字以下）/ `status`（既定 `'todo'`、`todo`・`in_progress`・`done` の check 制約）/ `created_at` / `updated_at`（`set_updated_at` トリガーで更新時に自動設定）。インデックス `(status, created_at)`。
- `status` は Postgres の enum ではなく text + check 制約。生成型では `string` になるため、アプリ側の `TaskStatus` へは `isTaskStatus`（`src/lib/tasks/types.ts`）で絞り込む。ステータスを増やすときは DB の check 制約・`TASK_STATUSES`・テストの3か所を同時に変える。
- **RLS は暫定で anon / authenticated に全操作を許可**している（認証未導入のため、URL と公開キーを知る人は誰でも読み書きできる）。認証を入れる際は `user_id` 列の追加・既存ポリシー（`tasks_*_all`）の差し替え・Server Action 内での認可チェックが必要。
- `database.types.ts` は自動生成ファイルなので手で編集しない（プロジェクトのコードスタイルと異なりセミコロン無しだが、そのままでよい）。
- MCP の `execute_sql` で動作確認するときは、`begin; set local role anon; ... rollback;` のように RLS を通した権限で試し、データを残さない。

## タスクカンバンの構成

- 読み取り: `page.tsx` → `<Suspense>` → `TaskBoardSection`（async Server Component、`getTasks()` を `created_at` 昇順で取得）→ `TaskBoard`（Client Component）。Cache Components 下ではキャッシュしないデータ取得を Suspense で包む必要がある（包まないと `next build` でエラーになる）。取得失敗時は `TaskBoardSection` がエラーメッセージを表示する。
- 書き込み: `src/app/actions.ts` の Server Actions（`createTask` / `updateTask(id, formData)` / `deleteTask(id)`）。`ActionResult`（`{ ok: true } | { ok: false; error }`）を返し、例外は投げない。ユーザー向けメッセージは日本語。成功時のみ `refresh()`（`next/cache`、Server Action 専用 API）でサーバーの最新データを再取得させる。データはキャッシュしていないので `revalidatePath` / `updateTag` は不要。
- 入力検証は `validateTaskInput`（`src/lib/tasks/validation.ts`）に集約し、DB の check 制約と揃える。クライアント（即時エラー表示）と Server Action（直接 POST される可能性への対策）の両方で呼ぶ。
- 即時反映: `TaskBoard` は `useOptimistic` で Server Action の応答前に画面を更新し、トランジション終了時に自動で props（サーバーの値）へ戻る。`await` の後の state 更新は `startTransition` で包む。追加直後の仮タスクは `pending-` で始まる仮 ID を持ち、サーバーの値に置き換わるまで編集・削除ボタンを無効にする。
- 削除確認は `ConfirmDialog`（`role="alertdialog"`）。jsdom で `<dialog>.showModal()` を避けるため、条件付きでレンダーし、shadcn の `AlertDialog`（Base UI）を `open` 固定で描画している。
- 新しい操作を足すときのパターン: 検証関数 → Server Action（`ActionResult` を返す）→ `TaskBoard` の `OptimisticAction` に種別を追加して `runAction` から呼ぶ。

## テスト

- Vitest + React Testing Library、環境は jsdom（`vitest.config.mts`）。`@/` エイリアスは Vite ネイティブの `resolve.tsconfigPaths: true` で解決しており、`vite-tsconfig-paths` プラグインは不要。
- テストファイルは `src/__tests__/` に置いている。ユーザー操作は `fireEvent` で再現している（`@testing-library/user-event` は未導入）。
- Vitest は `async` な Server Component をレンダーできない。ページのテストでは `@/components/TaskBoardSection` だけを `vi.mock` で差し替える（`src/__tests__/page.test.tsx`）。取得部分は E2E テストで検証する想定だが、E2E 環境はまだ無い。
- `@testing-library/jest-dom` は未導入のため、`toBeInTheDocument()` などのマッチャーは使えない（`toBeDefined()` / `toBeNull()` 等で代替）。
- vitest は `globals` が無効なので Testing Library の自動クリーンアップが効かない。1ファイルに複数のレンダーテストを書くときは `afterEach(cleanup)` を明示する。
- モックの境界: UI のテストでは `@/app/actions`、Server Action のテストでは `@/lib/supabase/server` と `next/cache`、接続確認のテストでは `fetch`（`vi.stubGlobal`）と環境変数（`vi.stubEnv`）をモックする。モックは `vi.hoisted` で定義し、`afterEach` で `vi.clearAllMocks()` / `unstubAll*` する。
- React 19 は保留中の非同期トランジションを全体で束ねるため、**完了しない Promise をテストに残すと後続テストのトランジションが終わらず、楽観的更新が元に戻らなくなる**。「応答前に反映される」ことを確かめるときは保留した Promise を `afterEach` で `act` の中で必ず解決する（`src/__tests__/TaskBoard.test.tsx` の `pending()` 参照）。
- UI テストはロールとラベルで要素を探している（列 = `region`「未着手 / 進行中 / 完了」、カード = `article`（タスク名）、フォーム = `form`「タスクを追加 / タスクを編集」、ダイアログ = `alertdialog`「タスクの削除」、エラー = `alert`）。これらの `aria-label` や表示文言を変えるとテストが壊れるので、変える場合はテストも合わせて直す。

## コーディングルール
- 変更後は必ず `npm test` でテストが通ることを確認してください
- 変更は1つの関心事に絞り、小さい単位で行ってください
- 指示された範囲以外のコードを変更しないでください

## コーディング規約
- コンポーネントは関数コンポーネントで記述してください
- 変数名・関数名はキャメルケースで書いてください
- コミットメッセージは日本語で書いてください

## テストルール
- 網羅性: 正常系・異常系・境界値を検討してください
- 可読性: テスト名に条件と期待する結果を明示してください
- 保守性: 実装の内部構造ではなくユーザーから見た振る舞いをテストしてください
- 独立性: テスト間で状態を共有しないでください
- 状態遷移: 画面遷移の順方向・逆方向を検証してください
- モック方針: 外部依存のみモック化してください

## 禁止事項
- console.logを本番コードに残さないでください
- 既存のテストを削除しないでください
- any型を使用しないでください

## MCP活用ルール
- Next.js・Supabase・Vitestなどの最新仕様はContext7 MCPを使って公式ドキュメントを確認してください
