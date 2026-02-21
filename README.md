<div align="center">
  <h1>✨ StrixReady</h1>
  <p><b>Dev Environments in Seconds</b></p>
  <p>Transform any GitHub repository into a production-ready local development environment instantly.</p>
</div>

---

## 📖 Overview

**StrixReady** is an intelligent, AI-powered tool designed to eliminate the friction of setting up local development environments. 

Instead of manually writing Dockerfiles, configuring `docker-compose.yml`, and setting up VS Code DevContainers, StrixReady automates the entire process. You simply provide a public GitHub repository URL and your target Operating System, and StrixReady handles the rest.

This repository contains the **Frontend GUI** for StrixReady. It provides a sleek, single-page, highly interactive user interface that communicates with the StrixReady backend engine.

## 🚀 How It Works

1. **Input**: The user pastes a GitHub repository URL and selects their host OS (Windows, macOS, or Linux).
2. **Dispatch**: The frontend sends a `POST` request with the payload `{"url": "...", "os": "..."}` to the local backend engine (running on port `8000`).
3. **Analysis (Backend)**: The backend clones the repository, scans package manifests, lock-files, and CI configs to infer the full tech stack.
4. **Generation**: A production-grade `devcontainer.json` and `docker-compose.yml` are assembled, wiring up necessary databases, caches, and services automatically.
5. **Ready to Code**: The user can instantly open the project in VS Code using the generated DevContainer.

## 💻 Tech Stack

The frontend is built with modern, high-performance web technologies:

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: React Router DOM
- **State & Fetching**: React Query & native Fetch API

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm
- The StrixReady Backend running locally on `http://localhost:8000`

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/sanjayrohith/StrixReady.git
   cd StrixReady
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the development server:
   ```sh
   npm run dev
   ```
   The frontend will be available at `http://localhost:8080` (or `8081` if occupied).

### Building for Production

```sh
npm run build
npm run preview
```

## 🎯 Project Goals & Vision

The ultimate goal of StrixReady is to **democratize and accelerate developer onboarding**. Whether you are joining a new company, contributing to an open-source project, or reviewing a PR, you shouldn't spend hours fighting environment variables, missing dependencies, or database connection issues.

## 🔮 Future Improvements

To make StrixReady even more powerful, the following improvements are planned for the frontend:

- [ ] **Real-time Progress Streaming**: Implement WebSockets or Server-Sent Events (SSE) to stream live logs from the backend while the repository is being cloned and analyzed, replacing the static loading spinner.
- [ ] **Interactive Config Editor**: Allow users to preview and manually tweak the generated `devcontainer.json` and `docker-compose.yml` (e.g., changing ports, adding VS Code extensions) directly in the browser before downloading.
- [ ] **Environment History**: Save a local history of recently generated environments for quick access.
- [ ] **Dark/Light Mode Toggle**: While the current dark-glassmorphism theme is sleek, adding a light mode option improves accessibility.
- [ ] **Direct "Open in VS Code" Integration**: Add deep linking (`vscode://`) to automatically launch the editor and trigger the container build without manual file placement.

---
<div align="center">
  <i>Built by the StrixReady Team &middot; Open Source</i>
</div>
