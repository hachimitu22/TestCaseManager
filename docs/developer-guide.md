# TestCaseManager (tcm)

TestCaseManager は、テストケースの作成・管理を支援する CLI + Web サーバー機能付きの OSS ツールです。
DDD を採用し、ドキュメント・型・UI 表示でユビキタス言語の乖離を防ぎます。

## MVP

npm 公開時の最小要件は「作成」「一覧」「保存」です。

- Web UI で testcase を作成できる
- testsuite と testcase を一覧できる
- testsuite 単位で XML ファイルへ保存できる

## ユビキタス言語

ユビキタス言語は [../docs/ubiquitous.md](../docs/ubiquitous.md) で管理します。
用語を追加・変更する場合は、README.md、AGENTS.md、このドキュメント、ユビキタス言語ファイルを同時に更新します。

## CLI

- `tcm init <dir>`
  - ルートディレクトリに `tcm.config.json` を作成します。
  - 指定ディレクトリを workspace として設定し、保存先ディレクトリを生成します。
- `tcm server -p <port>`
  - ルートディレクトリの `tcm.config.json` から workspace を読み取り、ローカルサーバーを起動します。
  - `-p` 未指定時のデフォルトポートは `3000` です。

## tcm.config.json

```json
{
  "version": 1,
  "workspaceDir": "workspace",
  "storageDir": "test-suites",
  "defaultSuiteName": "Default Testsuite"
}
```

- `version`: 設定ファイル形式のバージョン。
- `workspaceDir`: `tcm init <dir>` で指定した workspace ディレクトリ。相対パスの場合は `tcm.config.json` があるルートから解決する。
- `storageDir`: testsuite XML を保存する workspace 相対パス。
- `defaultSuiteName`: 新規 testsuite の初期表示名。

## Web API

- `GET /api/test-suites`: testsuite 一覧を返す。
- `GET /api/test-suites/:id`: testsuite 詳細を返す。未保存の場合は空の testsuite を返す。
- `PUT /api/test-suites/:id`: testsuite を XML として保存する。

## 開発時の起動

開発時は、バックエンドとフロントエンドを別々のターミナルで起動する。

先に `tcm.config.json` があるディレクトリでバックエンドを起動する。

```bash
npm run dev:server
```

ポートを明示する場合は、CLI 引数として渡す。

```bash
npm run dev:server -- -p 3000
```

別ターミナルで Vite の開発サーバーを起動する。

```bash
npm run dev
```

Vite は `/api` へのリクエストを `http://localhost:3000` に proxy する。ブラウザーでは Vite 側の URL を開く。

## XML 仕様

保存単位は `testsuite` です。初期仕様のルート要素は `<testsuite>` とし、各 `testcase` は記述方式、本文、根拠情報を持ちます。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuite id="login" name="Login">
  <testcase id="valid-login">
    <title>Valid login</title>
    <format>AAA</format>
    <content>
      <arrange>User exists</arrange>
      <act>User logs in</act>
      <assert>Dashboard opens</assert>
    </content>
    <notes>判断理由や作成過程を記録する</notes>
  </testcase>
</testsuite>
```

### XML タグの目的と互換性方針

- `<testsuite>`: testcase の保存単位。`id` と `name` を属性として保持する。
- `<testcase>`: テストの最小単位。`id` を属性として保持する。
- `<format>`: `AAA`、`GWT`、`TEXT` のいずれかを保持する。
- `<content>`: format ごとの本文を保持する。AAA は `<arrange>` `<act>` `<assert>`、GWT は `<given>` `<when>` `<then>`、TEXT は `<text>` を使う。
- `<notes>`: 組み合わせ表、作成過程、判断理由などの根拠情報を自由記述で保持する。

既存タグの意味は変更せず、構造化された根拠情報を追加する場合は新しい任意タグとして追加します。読み込み側は未知タグを無視できる設計を優先します。
