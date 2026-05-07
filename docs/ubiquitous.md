# ユビキタス言語

TestCaseManager で使う用語はこのファイルで管理する。
ドキュメント、実装、UI 表示の用語が乖離しないように、追加・変更時は関連箇所も同時に更新する。

## 名詞

- `testcase`: テストの最小単位。準備・操作・確認、またはそれに相当する自由記述を持つ。保存上は原則ディレクトリで表し、本体を `testcase.xml` に保持する。
- `testsuite`: `testcase` と子 `testsuite` の集合。グループまたはカテゴリーとして扱い、入れ子構造で管理できる。保存上はディレクトリで表し、自身の情報と直下要素の順序を `suite.xml` に保持する。
- `workspace`: TestCaseManager が管理対象とする作業領域。`testsuite` と `testcase` の保存先を含む。
- `根拠情報`: `testcase` を作成した理由や背景を説明する情報。組み合わせ表、作成過程、判断理由を含む。
- `作成過程`: `testcase` を作るまでの検討や手順。
- `判断理由`: 特定の `testcase` を必要と判断した理由、または不要と判断した理由。

## 動詞

- `作成する`: 新しい `testsuite` または `testcase` の実体を作る。
- `追加する`: 親 `testsuite` の配下に、子 `testsuite` または `testcase` を配置する。
- `保存する`: `testsuite` または `testcase` を XML としてファイルシステムに永続化する。
- `削除する`: `testsuite` または `testcase` をツリーから取り除き、対応するファイルも削除する。
- `移動する`: `testsuite` または `testcase` を別の親 `testsuite` 配下へ配置し直す。
- `記録する`: 作成過程、判断理由、組み合わせ表などの根拠情報を残す。
- `一覧する`: 指定した範囲の `testsuite` または `testcase` を表示できる形で取得する。
- `読み込む`: XML ファイルから `testsuite` または `testcase` を復元する。

## 名詞と動詞の組み合わせ

- `testsuite` を作成する。
- `testsuite` に `testcase` を追加する。
- `testsuite` に子 `testsuite` を追加する。
- `testcase` に根拠情報を記録する。
- `testsuite` を保存する。
- `testcase` を保存する。
- `testsuite` を削除する。
