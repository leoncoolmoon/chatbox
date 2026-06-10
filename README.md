# Chatbot PWA

A modern, powerful, and privacy-focused chatbot Progressive Web App (PWA). Connect to your favorite AI models, visualize conversation branches, and enjoy a seamless voice-enabled chat experience.

[English](#english) | [简体中文](#简体中文) | [Live Demo](https://leoncoolmoon.github.io/chatbox/)

---

<a name="english"></a>

## ✨ Features

- **Multi-Provider Support**: Seamlessly integrate with OpenAI, NVIDIA NIM, Anthropic, Google Gemini, Groq, Mistral, and local providers like LM Studio, Ollama, and LiteLLM.
- **Visual Conversation Tree**: Manage complex dialogues with a branching tree view. Switch between branches, delete specific nodes, and perform batch copies.
- **Voice Interaction**: High-quality Speech-to-Text (STT) for input and Text-to-Speech (TTS) for AI responses.
- **File Intelligence**: Upload and analyze PDF or text files directly within your chat sessions.
- **Local-First & Secure**: Your data stays on your device. Powered by IndexedDB for robust local storage.
- **Customizable Experience**:
  - Light, Dark, and System theme synchronization.
  - Multi-language UI (English & Chinese).
  - Configurable system prompts and a dedicated prompt library.
  - Adjustable temperature and context window settings.
- **Progressive Web App**: Installable on mobile and desktop for a native-like experience.
- **Built-in Search**: Quickly find past messages using the integrated search function.

## 🚀 Getting Started

1. **Host Anywhere**: It's a vanilla JS/HTML/CSS app. Use any static file server or GitHub Pages.
2. **Configure Provider**: Open the settings panel, select your provider (e.g., OpenAI or Ollama), and enter your API key or Base URL.
3. **Start Chatting**: Type your prompt or use the microphone icon for voice input.

## 🛠 Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3.
- **Storage**: IndexedDB (via `storage.js`).
- **Icons**: [Remix Icon](https://remixicon.com/).
- **PDF Processing**: [pdf.js](https://mozilla.github.io/pdf.js/).
- **PWA**: Web App Manifest & Service Worker.

---

<a name="简体中文"></a>

# Chatbot PWA

一个现代、强大且注重隐私的聊天机器人渐进式 Web 应用 (PWA)。连接您喜爱的 AI 模型，可视化对话分支，并享受流畅的语音交互体验。

## ✨ 功能特性

- **多模型支持**: 无缝集成 OpenAI, NVIDIA NIM, Anthropic, Google Gemini, Groq, Mistral，以及本地服务如 LM Studio, Ollama 和 LiteLLM。
- **对话树可视化**: 通过分支树状视图管理复杂对话。轻松切换分支、删除特定节点或进行批量复制。
- **语音交互**: 支持高精度语音转文字 (STT) 输入和语音合成 (TTS) 输出。
- **文件处理**: 直接上传并分析 PDF 或纯文本文件。
- **本地优先**: 您的数据仅存储在本地。使用 IndexedDB 提供可靠的数据持久化。
- **高度可定制**:
  - 支持亮色、暗色及系统主题同步。
  - 多语言 UI (中文 & 英文)。
  - 自定义系统提示词及内置提示词库。
  - 可调节的 Temperature (随机性) 和上下文窗口。
- **PWA 支持**: 可在手机和桌面端安装，提供原生应用般的体验。
- **内置搜索**: 使用集成搜索功能快速查找历史消息。

## 🚀 快速上手

1. **部署**: 这是一个纯前端应用。您可以使用任何静态服务器或 GitHub Pages 进行部署。
2. **配置服务商**: 打开设置面板，选择您的服务商（如 OpenAI 或 Ollama），输入 API Key 或 Base URL。
3. **开始对话**: 输入文字或点击麦克风图标进行语音输入。

## 🛠 技术栈

- **前端**: 原生 JavaScript, HTML5, CSS3.
- **存储**: IndexedDB (通过 `storage.js` 管理).
- **图标**: [Remix Icon](https://remixicon.com/).
- **PDF 处理**: [pdf.js](https://mozilla.github.io/pdf.js/).
- **PWA**: Web App Manifest & Service Worker.
