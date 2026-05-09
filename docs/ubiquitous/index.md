# ユビキタス言語

TestCaseManager で使う言葉はこのディレクトリで管理する。
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
テストケースを作成し、testsuite のツリーとして一覧できる形に整理し、後から復元できる成果物として保存する。

この文脈では、作成されたテストケースの本文だけでなく、作成過程や判断理由などの根拠情報も成果物の一部として扱う。

この文脈は、テストケース管理そのものを表す [Core Domain](core-domain.md) と、npm パッケージやローカルツールとして動かすための [Supporting Concern](supporting-concern.md) に分けて記述する。
`testsuite` と `testcase` は Core Domain の語である。
`workspace`、`storageDir`、`tcm config` は保存先や実行環境を解決するための支援的な語であり、Core Domain の data ではない。

## 用語対応

| 用語 | 分類 | 実装・保存上の表現 |
| ---- | ---- | ------------------ |
| `testsuite` | Core Domain | `Testsuite` 型 |
| `root testsuite` | Core Domain | テストケース管理ツリーの起点 |
| `testsuite item` | Core Domain | `TestsuiteItem` 型 |
| `testcase` | Core Domain | `Testcase` 型 |
| `testcase format` | Core Domain | `testcase content` の種類。実装上の識別値は `AAA` / `GWT` / `TEXT` |
| `根拠情報` | Core Domain | 現時点では `Testcase.notes` に保持 |
| `workspace` | Supporting Concern | `TcmConfig.workspaceDir` で解決されるディレクトリ |
| `storageDir` | Supporting Concern | `TcmConfig.storageDir`、既定値は `test-suites` |
| `tcm config` | Supporting Concern | `TcmConfig` 型、`tcm.config.json` |
| `XML 保存` | Supporting Concern | `suite.xml`、`testcase.xml`、`<testsuite>`、`<testcase>` |

## 更新ルール

- 実装に新しいドメイン語を追加する場合は、このディレクトリに定義する。
- 仕様変更で語の意味が変わる場合は、README.md、AGENTS.md、関連ドキュメント、実装上の名前を同時に確認する。
- UI 表示だけで別名を使う場合も、このディレクトリに対応関係を記録する。
- XML の専用タグを追加する場合は、タグの目的と後方互換性方針を関連ドキュメントへ記録する。
