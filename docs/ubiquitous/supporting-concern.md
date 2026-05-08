# Supporting Concern

Test Case Management Context のうち、npm パッケージやローカルツールとして動かすための設定・配置概念を定義する。

## data

```js
workspace =
  管理対象の作業領域
  AND storageDir
  AND tcm config
```

`workspace` は TestCaseManager が管理するローカル作業領域である。
`tcm init <dir>` で指定されたディレクトリが workspace になり、testsuite と testcase の保存先を含む。
Core Domain の概念ではなく、npm パッケージとしてローカル環境で動かすための配置概念である。

```js
storageDir =
  workspace からの相対パス
  AND root testsuite
```

`storageDir` は testsuite と testcase を XML ファイルとして保存する場所である。
`storageDir` のルート自体は Core Domain 上の `root testsuite` に対応し、直下に `suite.xml` を持つ。

```js
tcm config =
  version
  AND workspaceDir
  AND storageDir
  AND defaultSuiteName
```

`tcm config` は TestCaseManager を CLI とローカルサーバーとして動かすための設定である。
ルートディレクトリの `tcm.config.json` に保存し、サーバー起動時に workspace と保存先を解決する。
`tcm config` は Core Domain の data ではない。

## behavior

```js
初期化する =
  target directory -> tcm config AND workspace AND root testsuite
```

`初期化する` は `tcm init <dir>` によってローカル作業領域を準備する支援的な振る舞いである。
ルートディレクトリに `tcm.config.json` を作成し、workspace 内に `storageDir` を作成し、root testsuite の `suite.xml` を保存する。

```js
設定を読み込む =
  tcm config file -> tcm config
```

`設定を読み込む` は `tcm.config.json` から workspace と保存先を解決する支援的な振る舞いである。

## 制約・不変条件

- workspace の `storageDir` ルートは Core Domain 上の root testsuite に対応する。
- `tcm config` は npm パッケージとしての実行環境を表す設定であり、testcase 管理そのものの成果物ではない。
- CLI とローカルサーバーは `tcm config` から workspace と `storageDir` を解決する。
