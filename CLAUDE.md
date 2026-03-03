# LBE Platform Proto - Project Context

## プロジェクト概要

モビリティエンターテイメントのLBE（Location Based Entertainment）
プラットフォームのプロトタイプ。
車載タブレットで動作する、場所連動型エンターテイメントシステム。

## 目的

以下4点を社内・社外に証明するプロトタイプ。
1. 体験検証
2. 設計へのインプット生成
3. 要求の整理
4. コンテンツの量産性証明

## 動作環境

- iOS / Android タブレット混在
- 全台 Chrome 最新版を前提とする
- https環境必須（Geolocation APIのため）

## アーキテクチャ

### ディレクトリ構成

```
LBE-platform-proto-1/
├── core/
│   ├── geofence.js        # ジオフェンスエンジン
│   ├── location.js        # GPS・位置情報管理
│   └── audio.js           # 音声管理
├── contents/
│   ├── rhythm/            # リズムゲーム
│   ├── quiz-a/            # クイズタイプA（画面表示型）
│   └── quiz-b/            # クイズタイプB（レーン流れ型）
├── data/
│   └── locations.json     # 場所×コンテンツの対応表
├── assets/
│   └── audio/
└── index.html
```

### 設計方針

- 各コンテンツは疎結合で独立して動作できる
- 全コンテンツは共通インターフェースを実装する
- 場所とコンテンツはlocations.jsonで定義する
- 新コンテンツはcontents/に追加するだけで拡張できる

### 共通インターフェース

各コンテンツが必ず実装するメソッド。

```
onEnter()  // ジオフェンスに入ったとき・準備処理
onExit()   // ジオフェンスから出たとき・停止処理
onStart()  // コンテンツ開始
onStop()   // コンテンツ停止
getUI()    // コンテンツのHTML要素を返す
```

## コンテンツ仕様

### リズムゲーム（contents/rhythm/）

- Three.js 3D背景（昼間の明るいハイウェイ）
- 4レーン（KICK / SNARE / MELODY / HI-HAT）
- 判定：PERFECT / GREAT / GOOD / MISS
- 楽曲→譜面はPython/Librosaで自動生成
- iOS Autoplay Policy対応済み（初回タップで以降自動）

### クイズA（contents/quiz-a/）

- 画面に問題と選択肢を表示する
- 四択形式
- 同乗者専用（ドライバーは操作しない）
- 落ち着いた場面・長距離向け

### クイズB（contents/quiz-b/）

- 問題はWeb Speech APIで音声読み上げ
- 選択肢が1つずつ4レーンをランダムに流れてくる
- 何個流れてくるかユーザーには表示しない
- 正解の選択肢が来たらタップ・不正解はスルー
- 早とちりタップ→NG・正解スルー→NG
- 全選択肢通過後に結果発表と解説表示
- 盛り上がり場面・短距離向け

## データフォーマット

### locations.json

```json
{
  "id": "location_001",
  "name": "エリア名",
  "lat": 34.0522,
  "lng": -118.2437,
  "radius": 500,
  "content": "rhythm",
  "content_id": "001"
}
```

### questions.json

```json
{
  "id": "q001",
  "location_id": "location_002",
  "question": "問題文",
  "answer": "正解の選択肢",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "explanation": "解説文",
  "difficulty": "normal"
}
```

## デザイン方針

- テーマ：昼間の明るいアメリカのハイウェイ
- 背景：青空・アスファルト・白線・黄色中央線
- ノーツカラー：
  - レーン0（KICK）  → 赤
  - レーン1（SNARE） → 青
  - レーン2（MELODY）→ 緑
  - レーン3（HI-HAT）→ 黄
- フォント：ゲームらしくスタイリッシュに統一
- スマホ・タブレットで操作しやすいサイズ感

## 開発ルール

- バグ修正時は原因を特定してから修正する
- コンテンツ切り替え時は前コンテンツを完全にクリーンアップする
- DEBUGモードではジオフェンス判定を無効にする
- GitHubへのプッシュは必ず確認を取ること
- 座標にはダミー値を使う（個人情報保護）
- --dangerously-skip-permissionsで実行する

## 今後追加予定のコンテンツ

- 観光情報（音声＋画像）
- ライブ情報（アーティスト曲＋ライブ情報表示）
- 音楽＋壁紙変更（IP連動）

## 将来の技術移行候補

- HERE Maps SDK（商用地図）
- Unreal Engine（ネイティブアプリ化）
- WebSocket（複数台同期）
