# TestCaseManager (tcm)

TestCaseManager は、テストケースの作成・管理を支援する CLI + Web サーバー機能付きの OSS ツールです。
DDD を採用し、ドキュメント・型・UI 表示でユビキタス言語の乖離を防ぎます。

## MVP

npm 公開時の最小要件は「作成」「一覧」「保存」です。

- Web UI で testcase を作成できる
- testsuite と testcase を一覧できる
- testsuite と testcase を XML ファイルへ保存できる

## ユビキタス言語

ユビキタス言語は [../docs/ubiquitous.md](../docs/ubiquitous.md) で管理します。
用語を追加・変更する場合は、README.md、AGENTS.md、このドキュメント、ユビキタス言語ファイルを同時に更新します。
`testsuite` と `testcase` は Core Domain、`workspace`、`storageDir`、`tcm.config.json` は CLI とローカルサーバーを動かすための Supporting Concern として扱います。

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

- `GET /api/root-testsuite`: workspace ルートの testsuite 詳細を返す。
- `PUT /api/root-testsuite`: workspace ルートの testsuite を保存する。
- `POST /api/root-testsuite/children`: ルート直下に子 testsuite を作成する。
- `GET /api/test-suites`: ルート直下の testsuite 一覧を返す。
- `GET /api/test-suites/:id`: testsuite 詳細を返す。未保存の場合は空の testsuite を返す。
- `PUT /api/test-suites/:id`: testsuite を XML として保存する。
- `POST /api/test-suites/:parentId/children`: 子 testsuite を作成し、親 testsuite に参照を追加する。
- `DELETE /api/test-suites/:id`: 指定 testsuite と子孫 testsuite を削除する。

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

保存単位は `testsuite` と `testcase` です。`testsuite` はディレクトリとして保存し、自身の情報と直下要素の順序を `suite.xml` に保持します。`testcase` も原則ディレクトリとして保存し、本体を `testcase.xml` に保持します。

保存上は `storageDir` のルートが Core Domain 上の root testsuite に対応します。ID は `checkout/pay` のような `storageDir` からの相対パスです。同一階層では testsuite と testcase を同じ名前空間で扱い、同名を禁止します。異なる階層では同名を許可します。

```text
test-suites/
├── suite.xml
└── login/
    ├── suite.xml
    └── valid-login/
        └── testcase.xml
```

`suite.xml` の例:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="Login">
  <children>
    <testsuite-ref name="normal-cases" />
    <testcase-ref name="valid-login" />
  </children>
</testsuite>
```

`testcase.xml` の例:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testcase name="valid-login">
  <title>Valid login</title>
  <format>AAA</format>
  <content>
    <arrange>User exists</arrange>
    <act>User logs in</act>
    <assert>Dashboard opens</assert>
  </content>
  <notes>判断理由や作成過程を記録する</notes>
</testcase>
```

### XML タグの目的と互換性方針

- `<testsuite>`: testsuite 自身の情報。`name` を属性として保持する。
- `<children>`: 直下要素の種別、名前、表示順を保持する。
- `<testsuite-ref>`: 子 testsuite の名前参照。`name` 属性で同階層のディレクトリを指す。
- `<testcase-ref>`: 子 testcase の名前参照。`name` 属性で同階層のディレクトリを指す。
- `<testcase>`: テストの最小単位。`name` を属性として保持する。
- `<format>`: XML 上の互換表現として、`testcase content` の種類を `AAA`、`GWT`、`TEXT` のいずれかで保持する。
- `<content>`: testcase content の本文を保持する。`<format>` と必ず対応し、AAA は `<arrange>` `<act>` `<assert>`、GWT は `<given>` `<when>` `<then>`、TEXT は `<text>` を使う。
- `<notes>`: 組み合わせ表、作成過程、判断理由などの根拠情報を自由記述で保持する。

既存タグの意味は変更せず、構造化された根拠情報を追加する場合は新しい任意タグとして追加します。読み込み側は未知タグを無視できる設計を優先します。
`<children>` がない `suite.xml` は直下要素なしとして読み込みます。testsuite 削除時は、対象 testsuite のディレクトリごと子孫を削除し、親 `suite.xml` から参照を取り除きます。
