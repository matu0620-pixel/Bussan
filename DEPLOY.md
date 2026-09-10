# デプロイ手順

環境変数もデータベースも不要です。ZIPを展開したフォルダをそのままデプロイできます。

## A. Vercel CLI から（最短）

```bash
cd sonae
npm install
npx vercel          # 初回はブラウザでログイン。質問はすべて既定値で Enter
npx vercel --prod   # 本番URLを発行
```

`vercel` はフレームワークを Next.js と自動判別します。Build Command / Output Directory は変更不要です。

## B. GitHub 経由（更新のたびに自動デプロイしたい場合）

`.git` はこのZIPに含まれているので、初回コミット済みの状態から始められます。

```bash
cd sonae
gh repo create sonae --private --source=. --push
# または、GitHubで空のリポジトリを作ってから
git remote add origin git@github.com:<あなた>/sonae.git
git push -u origin main
```

そのあと Vercel の「Add New… → Project」でこのリポジトリを Import するだけです。
以降は `git push` するたびに自動でデプロイされます。

## C. 手元で動かすだけ

```bash
cd sonae
npm install
npm run dev     # http://localhost:3000
```

## 動作確認済みの環境

- Node.js 22 / npm 10
- Next.js 16.3.4（App Router）、React 19、TypeScript 5、Tailwind CSS v4
- `npm run build` 成功、全8画面をブラウザで表示確認済み

## 注意

`node_modules/` と `.next/` はZIPに含めていません。最初に `npm install` を実行してください。
