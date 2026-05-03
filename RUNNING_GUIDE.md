# ProjectFlow KE - System Operations Guide

This guide provides step-by-step instructions for starting, running, and managing the ProjectFlow KE Enterprise Collaboration System.

## 🚀 Quick Start

To launch the system in development mode, follow these steps:

1. **Open Terminal**: Navigate to the project root directory (`e:\ProjectFlow KE`).
2. **Install Dependencies**: (First time only)
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
4. **Access the Application**:
   Open your browser and navigate to:
   - **URL**: `http://localhost:5173`
   - **Alternate**: Check the terminal output for the specific local network address.

---

## 🛠️ System Architecture & Components

ProjectFlow KE is a high-performance React application powered by Vite. It includes several enterprise-grade modules:

- **Enterprise Workflow Engine**: Manages document lifecycles and departmental workspaces.
- **Collaboration Workspace**: Real-time multi-user editing using Yjs and WebRTC.
- **Knowledge Base**: Centralized repository for project documentation and system metadata.
- **Vault Security**: Zero-Trust identity management and audit logging.

---

## 📋 Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles the application for production deployment. |
| `npm run preview` | Serves the production build locally for final verification. |

---

## 🔍 Troubleshooting

- **Port Conflict**: If port `5173` is already in use, Vite will automatically attempt to use the next available port (e.g., `5174`).
- **Dependency Issues**: If the application fails to start, delete the `node_modules` folder and `package-lock.json`, then run `npm install` again.
- **White Screen**: Ensure your browser supports modern JavaScript features. Check the browser console (F12) for any runtime errors.

---

## 🔐 Security Note
The Collaboration Workspace utilizes P2P (Peer-to-Peer) synchronization via WebRTC. Ensure your network environment allows WebRTC traffic for full real-time functionality.

---
*© 2026 ProjectFlow KE - Enterprise Operations*
