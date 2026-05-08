# Core Domain

Test Case Management Context のうち、テストケース管理そのものを表す語を定義する。

## data

```js
testsuite =
  id
  AND name
  AND List<testsuite child>
```

`testsuite` は `testcase` と子 `testsuite` の集合である。
グループまたはカテゴリーとして扱い、入れ子構造で管理できる。
直下要素の種別、名前、順序を保持する。

```js
root testsuite =
  testsuite
```

`root testsuite` はテストケース管理ツリーの起点である。
Core Domain 上は `testsuite` であり、保存方式には依存しない。

```js
testsuite child =
  child kind
  AND name

child kind =
  testsuite OR testcase
```

`testsuite child` は親 `testsuite` の直下要素である。
同一親の中で順序を持つ。

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

```js
testcase format =
  testcase content の種類
```

`testcase format` は testcase content の種類を表す分類名、選択肢、表示名である。
`testcase` が `testcase format` と `testcase content` を独立に持つわけではない。
AAA format と Text content のような、記述方式と本文種類が一致しない組み合わせはドメイン上存在しない。
実装で識別子が必要な場合の値は `AAA`、`GWT`、`TEXT` を使う。

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
現時点では構造化された根拠情報は持たず、`testcase` の `notes` に自由記述として保持する。

## behavior

```js
読み込む =
  永続化された成果物 -> testsuite OR testcase
```

`読み込む` は永続化された成果物から `testsuite` または `testcase` を復元する振る舞いである。
testsuite の直下要素の種別、名前、順序を復元できる必要がある。

```js
一覧する =
  testsuite -> List<testsuite child>
```

`一覧する` は指定した testsuite の直下要素を表示できる形で取得する振る舞いである。
MVP では、testsuite と testcase をツリーとして把握できることを重視する。

```js
保存する =
  testsuite OR testcase -> 永続化可能な成果物
```

`保存する` は `testsuite` または `testcase` を後から復元できる成果物として永続化する振る舞いである。
保存形式は Core Domain では定めない。

```js
子 testsuite を作成する =
  parent testsuite AND child name -> child testsuite
```

`子 testsuite を作成する` は親 testsuite の配下に新しい testsuite を配置する振る舞いである。
作成した子 testsuite は親 testsuite の直下要素として追加される。

```js
testcase を追加する =
  parent testsuite AND testcase -> parent testsuite
```

`testcase を追加する` は親 testsuite の配下に testcase を配置する振る舞いである。
testcase は親 testsuite の直下要素として追加される。

```js
testsuite を削除する =
  testsuite -> removed testsuite tree
```

`testsuite を削除する` は対象 testsuite と配下の子孫 testsuite をツリーから取り除く振る舞いである。
親 testsuite の直下要素から対象を取り除く。

## 制約・不変条件

- testsuite は直下要素の種別、名前、順序を保持する。
- 同一階層では testsuite と testcase を同じ名前空間で扱い、同名を禁止する。
- 異なる階層では同名の testsuite または testcase を許可する。
- root testsuite は削除できない。
- testsuite 削除時は、対象 testsuite と配下の子孫 testsuite を削除する。
