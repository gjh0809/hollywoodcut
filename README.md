# Hollywood Cut 🎬

基于纯前端架构的电影质感照片生成工具，利用 Google Gemini 大语言模型，实现了智能 Prompt 生成提示词、照片二次风格化、以及完全零泄露的数据安全策略。

## 安全性检查与架构说明

✅ **已完成全面安全检查**
经过代码审计，**此项目内没有任何个人信息或 API Key 泄露风险**。
为了实现"不写在前端代码里"的绝对安全要求，本项目采用**用户界面动态输入 + LocalStorage 本地存储**的认证模式：
- 避免了通过环境变量（如 `.env` 及 `VITE_APP_*`）在打包阶段注入 API Key 并暴露在 Source Code 中引起的窃取风险。
- 项目无后端服务端代码，纯依赖前端引入 CDN 在浏览器中执行请求。
- 虽然我们附带了 `.env.example` 用于备忘项目所需参数，但在实际静态部署中无需在 GitHub Secrets 或 Vercel 等平台配置任何系统级环境变量。

## 本地极速体验
项目使用了 `babel/standalone` 与官方 ESM Cnd，所有 JSX 均在浏览器内动态编译执行，无需安装 Node.js、Vite 或 Webpack等工具。
**使用方法**：直接双击 `index.html` 或者通过任何静态服务器（如 VSCode Live Server）打开运行，即可顺畅体验全部功能。

## 部署工作流设计 (GitHub Actions)

该项目已经为您编写了自动部署到 GitHub Pages 的自动化工作流（即 `.github/workflows/deploy.yml`）。无需传统的编译打包步骤。

### 部署与生效操作

1. **推送代码**：将全部代码分支（包括您可能新增的资源）推送到新建的 `hollywoodcut` 仓库的 `main` 分支上（代码上传方式见下方“操作流程”部分）。
2. **启用 Pages Options**：打开该 GitHub 仓库，导航至 **Settings -> Pages** 面板。
3. **切换 Source 源**：在 `Build and deployment` 下拉菜单处，将源头修改为 **GitHub Actions**。
4. 完成以上步骤后，一旦有新的 Push 动作，它将全自动触发 Action，将该项目作为完整静态网站提供外网访问！

## 将项目推送到新仓库 (操作流程）

如果你尚未推送到新的仓库，请依据终端中的实际情况运行以下指引命令：

```bash
# 1. 确保在项目根目录，如果还未初始化仓库，先执行：
git init
git add .
git commit -m "Init: 安全策略验证与 GitHub Actions 部署工作流"

# 2. 将本地代码指向你在 GitHub 创建好的空仓库 hollywoodcut
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/hollywoodcut.git

# 3. 开始上传发布！
git push -u origin main
```
