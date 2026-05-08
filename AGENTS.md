# AGENTS.md

このファイルは TestCaseManager リポジトリで作業するエージェント向けの開発方針です。

## プロジェクト概要

- プロジェクト名: **TestCaseManager (tcm)**
- 目的: テストケースの作成・管理を支援するツールを開発する
- 提供形態: CLI + Web サーバー機能
- 公開形態: OSS（MIT License）

## 開発方針

- DDD で開発する
- ユビキタス言語を明確化し、ドキュメントと実装の乖離を防ぐ
- テストケース作成の過程・理由も成果物として扱える設計を優先する
- testsuite / testcase は Core Domain、workspace / storageDir / tcm config は支援的な設定・配置概念として扱う

## MVP（npm 公開時の最小要件）

- 作成
- 一覧
- 保存

## CLI 方針

- `tcm init <dir>`
  - ルートディレクトリに `tcm.config.json` を作成する
  - 指定ディレクトリを workspace として初期化し、`tcm.config.json` に記録する
- `tcm server -p <port>`
  - ルートディレクトリの `tcm.config.json` から workspace を読み取ってローカルサーバーを起動する
  - デフォルトポートは `3000`

## ディレクトリ構成

| ディレクトリ | 内容 |
| ------------ | ---- |
| `/src` | プロダクトコード |
| `/__tests__` | テストコード |
| `/docs` | 開発者向けドキュメント、設計書、ユビキタス言語 |

## データ保存方針

- 最終成果物はファイルとして扱う
- 出力ファイルはすべて XML 形式とする
- testsuite はディレクトリとして保存し、メタ情報と直下要素の順序を `suite.xml` に保持する
- testcase は原則ディレクトリとして保存し、本体を `testcase.xml` に保持する
- testsuite と testcase のツリー構造とフォルダ構成を一致させる
- 内部的に DB を利用する場合でも、XML への出力を必須とする
- Git 管理しやすいファイル構造・差分を意識する

## テストケース仕様（初版）

- testsuite は子 testsuite を追加可能な入れ子構造として扱う
- 保存上は workspace の `storageDir` ルートを root testsuite に対応させる
- 同一階層では testsuite と testcase を同じ名前空間で扱い、同名を禁止する
- 異なる階層では同名の testsuite / testcase を許可する
- testsuite 削除時は対象 testsuite と配下の子孫 testsuite を削除する
- testcase content の種類はケース単位で選択可能
  - AAA 方式
  - Given-When-Then 方式
  - テキスト記述方式
- testcase format は testcase content の種類を表す呼び名とし、記述方式と本文種類が一致しない組み合わせは扱わない
- 作成時の根拠情報を保持できるようにする
  - 組み合わせ表
  - 作成過程
  - 判断理由

## 用語定義（初版）

ユビキタス言語は [docs/ubiquitous](docs/ubiquitous/index.md) で管理する。

## 実装時の注意

- 仕様変更時は README.md と本ファイル（AGENTS.md）を同時更新する
- README.md は利用者向けドキュメントとして扱い、Core Domain / Supporting Concern など開発者だけが理解していればよい設計分類は含めない
- XML の専用タグを追加する場合は、目的と互換性方針を記録する
- ユビキタス言語に追加・変更があれば、docs/ubiquitous 配下と関連ドキュメントへ反映する
