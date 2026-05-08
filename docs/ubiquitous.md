# ユビキタス言語

TestCaseManager で使う言葉はこのファイルで管理する。
ここでいうユビキタス言語は単なる用語集ではなく、TestCaseManager のドメインを説明するための語彙、構造、制約、振る舞い、文脈を含む半形式の言語である。

ドキュメント、実装、UI 表示の用語が乖離しないように、用語や意味を追加・変更する場合は関連箇所も同時に更新する。

## 記法

- `data`: ドメイン上の情報、状態、成果物を表す。
- `behavior`: ドメイン上の振る舞いを表す。
- `A AND B`: A と B の両方を持つ。
- `A OR B`: A または B のいずれかを選ぶ。
- `List<A>`: A を 0 件以上、順序つきで持つ。
- `A?`: A は任意である。
- `A -> B`: A を入力または前提として B を生成する。
- `//`: 補足説明を表す。

## Bounded Context

### Test Case Management Context

TestCaseManager の MVP で扱う中心の文脈。
テストケースを作成し、testsuite のツリーとして一覧できる形に整理し、XML ファイルとして保存する。

この文脈では、作成されたテストケースの本文だけでなく、作成過程や判断理由などの根拠情報も成果物の一部として扱う。

この文脈は、テストケース管理そのものを表す Core Domain と、npm パッケージやローカルツールとして動かすための Supporting Concern に分けて記述する。
`testsuite` と `testcase` は Core Domain の語である。
`workspace`、`storageDir`、`tcm config` は保存先や実行環境を解決するための支援的な語であり、Core Domain の data ではない。

## Core Domain

### data

```js
testsuite =
  id
  AND name
  AND List<testsuite child>
```

`testsuite` は `testcase` と子 `testsuite` の集合である。
グループまたはカテゴリーとして扱い、入れ子構造で管理できる。
保存上はディレクトリで表し、自身の情報と直下要素の順序を `suite.xml` に保持する。

```js
root testsuite =
  testsuite
```

`root testsuite` はテストケース管理ツリーの起点である。
Core Domain 上は `testsuite` であり、保存上は Supporting Concern の `storageDir` ルートに対応する。

```js
testsuite child =
  child kind
  AND name

child kind =
  testsuite OR testcase
```

`testsuite child` は親 `testsuite` の直下要素である。
`suite.xml` の `<children>` に、種別、名前、順序を保持する。

```js
testcase =
  id
  AND name
  AND title
  AND testcase content
  AND notes
```

`testcase` はテストの最小単位である。
準備・操作・確認、またはそれに相当する自由記述を持つ。
保存上は原則ディレクトリで表し、本体を `testcase.xml` に保持する。

```js
testcase format =
  testcase content の種類
```

`testcase format` は testcase content の種類を表す分類名、選択肢、表示名である。
`testcase` が `testcase format` と `testcase content` を独立に持つわけではない。
AAA format と Text content のような、記述方式と本文種類が一致しない組み合わせはドメイン上存在しない。
実装や XML で識別子が必要な場合の値は `AAA`、`GWT`、`TEXT` を使う。

```js
testcase content =
  AAA testcase content OR Given-When-Then testcase content OR Text testcase content

AAA testcase content =
  arrange AND act AND assert

Given-When-Then testcase content =
  given AND when AND then

Text testcase content =
  text
```

`testcase content` は記述方式ごとの本文である。
AAA は準備、操作、確認で表し、Given-When-Then は前提、出来事、期待結果で表す。
Text は自由記述で表す。

```js
根拠情報 =
  組み合わせ表?
  AND 作成過程?
  AND 判断理由?
  AND 自由記述?
```

`根拠情報` は testcase を作成した理由や背景を説明する情報である。
現時点の XML 仕様では、構造化された根拠情報は持たず、`testcase` の `notes` に自由記述として保存する。

### behavior

```js
読み込む =
  XML file -> testsuite OR testcase
```

`読み込む` は XML ファイルから `testsuite` または `testcase` を復元する振る舞いである。
`suite.xml` から直下要素の順序を読み取り、`testcase-ref` があれば対応する `testcase.xml` を読み込む。

```js
一覧する =
  testsuite -> List<testsuite child>
```

`一覧する` は指定した testsuite の直下要素を表示できる形で取得する振る舞いである。
MVP では、testsuite と testcase をツリーとして把握できることを重視する。

```js
保存する =
  testsuite OR testcase -> XML file
```

`保存する` は `testsuite` または `testcase` を XML としてファイルシステムに永続化する振る舞いである。
`testsuite` は `suite.xml`、`testcase` は `testcase.xml` に保存する。

```js
子 testsuite を作成する =
  parent testsuite AND child name -> child testsuite
```

`子 testsuite を作成する` は親 testsuite の配下に新しい testsuite を配置する振る舞いである。
作成した子 testsuite はディレクトリと `suite.xml` を持ち、親 testsuite の `<children>` に `testsuite-ref` として追加される。

```js
testcase を追加する =
  parent testsuite AND testcase -> parent testsuite
```

`testcase を追加する` は親 testsuite の配下に testcase を配置する振る舞いである。
testcase はディレクトリと `testcase.xml` を持ち、親 testsuite の `<children>` に `testcase-ref` として追加される。

```js
testsuite を削除する =
  testsuite -> removed testsuite tree
```

`testsuite を削除する` は対象 testsuite と配下の子孫 testsuite をツリーから取り除く振る舞いである。
親 testsuite の `<children>` から対象への参照を取り除き、対象ディレクトリを削除する。

### 制約・不変条件

- 最終成果物はファイルとして扱い、XML 形式で保存する。
- testsuite はディレクトリとして保存し、メタ情報と直下要素の順序を `suite.xml` に保持する。
- testcase は原則ディレクトリとして保存し、本体を `testcase.xml` に保持する。
- testsuite と testcase のツリー構造とフォルダ構成は一致させる。
- 同一階層では testsuite と testcase を同じ名前空間で扱い、同名を禁止する。
- 異なる階層では同名の testsuite または testcase を許可する。
- root testsuite は削除できない。
- testsuite 削除時は、対象 testsuite と配下の子孫 testsuite を削除する。
- 既存 XML タグの意味は変更しない。
- XML に専用タグを追加する場合は、目的と互換性方針を記録する。

## Supporting Concern

### data

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

### behavior

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

### 制約・不変条件

- workspace の `storageDir` ルートは Core Domain 上の root testsuite に対応する。
- `tcm config` は npm パッケージとしての実行環境を表す設定であり、testcase 管理そのものの成果物ではない。
- CLI とローカルサーバーは `tcm config` から workspace と `storageDir` を解決する。

## 用語対応

| 用語 | 分類 | 実装・保存上の表現 |
| ---- | ---- | ------------------ |
| `testsuite` | Core Domain | `Testsuite` 型、`suite.xml`、`<testsuite>` |
| `root testsuite` | Core Domain | `storageDir` ルートの `suite.xml` |
| `testsuite child` | Core Domain | `TestsuiteChild` 型、`<testsuite-ref>`、`<testcase-ref>` |
| `testcase` | Core Domain | `Testcase` 型、`testcase.xml`、`<testcase>` |
| `testcase format` | Core Domain | `testcase content` の種類。実装・XML 上の識別値は `AAA` / `GWT` / `TEXT` |
| `根拠情報` | Core Domain | 現時点では `<notes>` に保存 |
| `workspace` | Supporting Concern | `TcmConfig.workspaceDir` で解決されるディレクトリ |
| `storageDir` | Supporting Concern | `TcmConfig.storageDir`、既定値は `test-suites` |
| `tcm config` | Supporting Concern | `TcmConfig` 型、`tcm.config.json` |

## 更新ルール

- 実装に新しいドメイン語を追加する場合は、このファイルに定義する。
- 仕様変更で語の意味が変わる場合は、README.md、AGENTS.md、関連ドキュメント、実装上の名前を同時に確認する。
- UI 表示だけで別名を使う場合も、このファイルに対応関係を記録する。
- XML の専用タグを追加する場合は、タグの目的と後方互換性方針を関連ドキュメントへ記録する。
