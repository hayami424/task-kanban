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
- **Tailwind CSS v4 を Turbopack ローダー経由で処理**（`next.config.ts` の `turbopack.rules` で `*.css` に `@tailwindcss/turbopack` を適用）。PostCSS 設定ファイルは存在しない。テーマトークン（`--color-background` 等）は `src/app/globals.css` の `@theme inline` で定義。
- `layout.tsx` などで使う `LayoutProps<"/">` / `PageProps` はグローバル型ヘルパー（Next.js が `.next/types` に生成）で、import 不要。

## テスト

- Vitest + React Testing Library、環境は jsdom（`vitest.config.mts`）。`@/` エイリアスは Vite ネイティブの `resolve.tsconfigPaths: true` で解決しており、`vite-tsconfig-paths` プラグインは不要。
- テストファイルは `src/__tests__/` に置いている。
- Vitest は `async` な Server Component をレンダーできない。そうしたコンポーネントは E2E テストで検証する。
- `@testing-library/jest-dom` は未導入のため、`toBeInTheDocument()` などのマッチャーは使えない（`toBeDefined()` 等で代替）。

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
