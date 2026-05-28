# ChatGPT Share to Markdown

An Obsidian desktop plugin that imports ChatGPT shared conversation links and saves them as Markdown notes.

Languages: [English](#english) | [中文](#中文) | [日本語](#日本語) | [한국어](#한국어)

## English

### What It Does

ChatGPT Share to Markdown turns a public ChatGPT shared link into a clean Markdown note inside Obsidian.

It keeps the conversation structure, separates user and assistant messages, and preserves ChatGPT web citations as normal Markdown links when source metadata is available.

### Features

- Import a ChatGPT shared link from the clipboard.
- Import a ChatGPT shared link by entering the URL manually.
- Save the shared conversation as a Markdown note in Obsidian.
- Preserve user and assistant turns as readable sections.
- Convert ChatGPT citation markers into Markdown links.
- Filter internal search/tool messages from the exported note.

### Installation

Download the latest release zip, then copy the plugin files into:

```text
<vault>/.obsidian/plugins/chatgpt-share-to-markdown/
```

Required files:

```text
main.js
manifest.json
```

Restart Obsidian or reload plugins, then enable **ChatGPT Share to Markdown** in Community plugins.

### Usage

Open the Obsidian command palette and run one of these commands:

- **Import ChatGPT shared link**
- **Import ChatGPT shared link (enter URL)**

## 中文

### 这是什么

ChatGPT Share to Markdown 是一个 Obsidian 桌面端插件，可以把公开的 ChatGPT 分享链接导入为 Markdown 笔记。

它会保留对话结构，区分用户和助手消息，并在分享页包含来源元数据时，把 ChatGPT 的网页引用保留为标准 Markdown 链接。

### 功能

- 从剪贴板导入 ChatGPT 分享链接。
- 手动输入 ChatGPT 分享链接导入。
- 在 Obsidian 中生成 Markdown 笔记。
- 按用户和助手消息整理对话内容。
- 将 ChatGPT 引用标记转换成 Markdown 链接。
- 过滤内部搜索、工具调用等非正文消息。

### 安装

下载最新 release 压缩包，然后把插件文件复制到：

```text
<你的库>/.obsidian/plugins/chatgpt-share-to-markdown/
```

需要的文件：

```text
main.js
manifest.json
```

重启 Obsidian 或重新加载插件，然后在社区插件里启用 **ChatGPT Share to Markdown**。

### 使用

打开 Obsidian 命令面板，运行以下任意命令：

- **Import ChatGPT shared link**
- **Import ChatGPT shared link (enter URL)**

## 日本語

### 概要

ChatGPT Share to Markdown は、公開された ChatGPT 共有リンクを Obsidian の Markdown ノートとして取り込むデスクトップ用プラグインです。

会話の構造を保ち、ユーザーとアシスタントの発言を分けて保存します。共有ページに参照元のメタデータが含まれている場合は、ChatGPT の引用マーカーを通常の Markdown リンクとして残します。

### 機能

- クリップボードから ChatGPT 共有リンクを読み込みます。
- URL を手動入力して ChatGPT 共有リンクを読み込みます。
- Obsidian に Markdown ノートとして保存します。
- ユーザーとアシスタントの発言を読みやすく整理します。
- ChatGPT の引用マーカーを Markdown リンクに変換します。
- 内部検索やツール呼び出しなど、本文ではないメッセージを除外します。

### インストール

最新の release zip をダウンロードし、プラグインファイルを次の場所にコピーします。

```text
<vault>/.obsidian/plugins/chatgpt-share-to-markdown/
```

必要なファイル:

```text
main.js
manifest.json
```

Obsidian を再起動するかプラグインを再読み込みし、Community plugins で **ChatGPT Share to Markdown** を有効にしてください。

### 使い方

Obsidian のコマンドパレットを開き、次のいずれかを実行します。

- **Import ChatGPT shared link**
- **Import ChatGPT shared link (enter URL)**

## 한국어

### 소개

ChatGPT Share to Markdown은 공개 ChatGPT 공유 링크를 Obsidian의 Markdown 노트로 가져오는 데스크톱 플러그인입니다.

대화 구조를 유지하고 사용자와 어시스턴트 메시지를 구분해 저장합니다. 공유 페이지에 출처 메타데이터가 포함되어 있으면 ChatGPT 인용 표시를 일반 Markdown 링크로 보존합니다.

### 기능

- 클립보드에서 ChatGPT 공유 링크를 가져옵니다.
- URL을 직접 입력해 ChatGPT 공유 링크를 가져옵니다.
- Obsidian에 Markdown 노트로 저장합니다.
- 사용자와 어시스턴트 발화를 읽기 쉬운 섹션으로 정리합니다.
- ChatGPT 인용 표시를 Markdown 링크로 변환합니다.
- 내부 검색 및 도구 호출 같은 본문이 아닌 메시지를 제외합니다.

### 설치

최신 release zip을 다운로드한 뒤 플러그인 파일을 다음 위치에 복사합니다.

```text
<vault>/.obsidian/plugins/chatgpt-share-to-markdown/
```

필요한 파일:

```text
main.js
manifest.json
```

Obsidian을 재시작하거나 플러그인을 다시 불러온 뒤, Community plugins에서 **ChatGPT Share to Markdown**을 활성화하세요.

### 사용법

Obsidian 명령 팔레트를 열고 다음 명령 중 하나를 실행합니다.

- **Import ChatGPT shared link**
- **Import ChatGPT shared link (enter URL)**

## Technical Notes

- Built with TypeScript and bundled with esbuild as an Obsidian CommonJS plugin.
- Fetches the ChatGPT shared page HTML through Obsidian's `requestUrl`.
- Extracts serialized loader data from `streamController.enqueue(...)` chunks.
- Resolves ChatGPT's indexed loader-data references into plain JavaScript objects.
- Converts `message_slice`, `deep_research`, and `code_block` attachments into Markdown.
- Maps `metadata.content_references` citation markers to Markdown links, including newer ChatGPT citation formats.
- Production builds are copied into `dist/` for direct installation.

## Development

```bash
npm install
npm run build
```

## License

MIT

