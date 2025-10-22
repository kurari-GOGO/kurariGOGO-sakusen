# Raid Strat Whiteboard

初心者向け：このプロジェクトをローカルで起動 → URL をギルドに共有 → Vercel/Netlify で無料公開の手順です。

## ① ローカルで動かす（Windows/Mac 共通）
1. Node.js をインストール（公式サイトの LTS 版）。
2. このフォルダを解凍して、フォルダ内でコマンドを実行：
   ```bash
   npm install
   npm run dev
   ```
3. ターミナルに表示される `http://localhost:5173` をブラウザで開く。

## ② 公開してギルドに配る（Vercel が簡単）
### A. GitHub を使う方法
1. GitHub に新しいリポジトリを作成 → このフォルダの内容をアップロード。
2. https://vercel.com に GitHub 連携でログイン → 「Add New Project」→ さっきのリポジトリを選択 → デフォルトのまま Deploy。
3. 数十秒で `https://<your-name>.vercel.app` の URL が発行されます。これをギルドに配布。

### B. ZIP アップロードだけで公開（Netlify）
1. `npm run build` を実行。`dist/` フォルダができます。
2. https://app.netlify.com でログイン → 「Add new site」→ 「Deploy manually」→ `dist/` フォルダをドラッグ&ドロップ。
3. 公開 URL が発行されます。

## ③ よくある質問
- **背景画像はどう貼る？** 左の「背景URL」に画像の直リンク（https で終わりが .png / .jpg など）を貼るだけ。
- **画像を書き出すには？** 「PNGを書き出し」ボタンを押す。
- **トークンの範囲を変える？** トークン上でマウスホイール、クリックで100→150→OFF切替。

## ④ カスタム
- `src/App.jsx` を編集すると機能を増やせます。
- 変更後は `npm run build` → 再デプロイしてください。
