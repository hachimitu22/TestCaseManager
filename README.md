# TestCaseManager (tcm)

TestCaseManager は、テストケースの作成・一覧・保存を支援する CLI + ローカル Web UI ツールです。

作成した testsuite と testcase は XML ファイルとして保存されるため、Git で差分を確認しながら管理できます。

## 必要環境

- Node.js 20 以上

## インストール

```bash
npm install tcm
```

一時的に実行する場合は `npx` も利用できます。

```bash
npx tcm --help
```

## Quick Start

作業用ディレクトリで workspace を初期化します。

```bash
npx tcm init ./workspace
```

初期化すると、カレントディレクトリに `tcm.config.json` が作成され、指定した `./workspace` が TestCaseManager の workspace として設定されます。

次にローカルサーバーを起動します。

```bash
npx tcm server -p 3000
```

ブラウザーで `http://localhost:3000` を開くと、Web UI から testsuite と testcase を作成できます。

## CLI

### `tcm init <dir>`

TestCaseManager の workspace を初期化します。

- カレントディレクトリに `tcm.config.json` を作成します。
- `<dir>` を workspace として設定します。
- workspace 内に testsuite 保存用の `test-suites` ディレクトリを作成します。

例:

```bash
npx tcm init ./workspace
```

### `tcm server -p <port>`

ローカル Web UI と API サーバーを起動します。

- カレントディレクトリの `tcm.config.json` を読み込みます。
- `tcm.config.json` に記録された workspace を利用します。
- `-p` を省略した場合のポートは `3000` です。

例:

```bash
npx tcm server -p 3000
```

## 保存されるファイル

`tcm init ./workspace` を実行すると、次のような構成になります。

```text
.
├── tcm.config.json
└── workspace/
    └── test-suites/
```

Web UI で保存した testsuite と testcase は、workspace 内の `test-suites/` 配下にツリー構造と同じフォルダ構成で保存されます。

```text
workspace/
└── test-suites/
    ├── suite.xml
    └── checkout/
        ├── suite.xml
        └── pay/
            └── testcase.xml
```

設定ファイルの例:

```json
{
  "version": 1,
  "workspaceDir": "workspace",
  "storageDir": "test-suites",
  "defaultSuiteName": "Default Testsuite"
}
```

## テストケースの記述方式

testcase ごとに次の形式を選択できます。

- AAA
- Given-When-Then
- Text

作成過程や判断理由などの根拠情報は、notes として testcase に残せます。

## testsuite の入れ子構造

testsuite は子 testsuite と testcase を持てます。workspace の `test-suites/` ルート自体も testsuite として扱い、直下に `suite.xml` を置きます。

各 testsuite はディレクトリ、各 testcase もディレクトリとして保存します。ID は `checkout/pay` のような `test-suites/` からの相対パスです。同一階層では testsuite と testcase を同じ名前空間で扱い、同名を禁止します。異なる階層では同名を許可します。

親子関係と表示順は親の `suite.xml` 内の `<children>` で表します。

```xml
<testsuite name="Login">
  <children>
    <testsuite-ref name="normal-cases" />
    <testcase-ref name="valid-login" />
  </children>
</testsuite>
```

testsuite を削除すると、対象 testsuite と配下の子孫 testsuite を削除します。

## 関連ドキュメント

- 詳細設計: [docs/README.md](docs/README.md)
- 用語定義: [docs/ubiquitous](docs/ubiquitous/index.md)

## License

MIT
