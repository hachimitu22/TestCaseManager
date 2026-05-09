# Supporting Concern

## 概要

Test Case Management Context のうち、npm パッケージやローカルツールとして動かすための設定・配置概念を定義する。
workspace、storageDir、tcm config、XML 保存を中心に、CLI とローカルサーバーが Core Domain の成果物を扱うための支援的な語を整理する。

## 一覧

|          名称           |                          内容                           |
| ----------------------- | ------------------------------------------------------- |
| data workspace          | TestCaseManager が管理するローカル作業領域              |
| data storageDir         | testsuite と testcase を XML ファイルとして保存する場所 |
| data XML 保存           | この npm パッケージにおける永続化方式                   |
| data tcm config         | CLI とローカルサーバーとして動かすための設定            |
| behavior 初期化する     | `tcm init <dir>` によってローカル作業領域を準備する     |
| behavior 設定を読み込む | `tcm.config.json` から workspace と保存先を解決する     |

## data

```js
data workspace =
  管理対象の作業領域
  AND storageDir
  AND tcm config
```

`workspace` は TestCaseManager が管理するローカル作業領域である。
`tcm init <dir>` で指定されたディレクトリが workspace になり、testsuite と testcase の保存先を含む。
Core Domain の概念ではなく、npm パッケージとしてローカル環境で動かすための配置概念である。

```js
data storageDir =
  workspace からの相対パス
  AND root testsuite
```

`storageDir` は testsuite と testcase を XML ファイルとして保存する場所である。
`storageDir` のルート自体は Core Domain 上の `root testsuite` に対応し、直下に `suite.xml` を持つ。

```js
data XML 保存 =
  testsuite OR testcase -> testcase.xml OR suite.xml
```

`XML 保存` は、この npm パッケージにおける永続化方式である。
Core Domain の `testsuite` と `testcase` を XML ファイルとして保存し、後から復元できるようにする。
testsuite はディレクトリとして保存し、メタ情報と直下要素の順序を `suite.xml` に保持する。
testcase は原則ディレクトリとして保存し、本体を `testcase.xml` に保持する。
testsuite と testcase のツリー構造とフォルダ構成は一致させる。

```js
data tcm config =
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
behavior 初期化する =
  target directory -> tcm config AND workspace AND root testsuite
```

`初期化する` は `tcm init <dir>` によってローカル作業領域を準備する支援的な振る舞いである。
ルートディレクトリに `tcm.config.json` を作成し、workspace 内に `storageDir` を作成し、root testsuite の `suite.xml` を保存する。

```js
behavior 設定を読み込む =
  tcm config file -> tcm config
```

`設定を読み込む` は `tcm.config.json` から workspace と保存先を解決する支援的な振る舞いである。

## 制約・不変条件

- workspace の `storageDir` ルートは Core Domain 上の root testsuite に対応する。
- `tcm config` は npm パッケージとしての実行環境を表す設定であり、testcase 管理そのものの成果物ではない。
- CLI とローカルサーバーは `tcm config` から workspace と `storageDir` を解決する。
- 最終成果物はファイルとして扱い、XML 形式で保存する。
- 既存 XML タグの意味は変更しない。
- XML に専用タグを追加する場合は、目的と互換性方針を記録する。
