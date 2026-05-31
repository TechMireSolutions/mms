# Madrasa Management System (Monorepo)

This repository contains the decoupled and modernized codebase for the Dar ul Quran application. It is structured as an NPM Workspace (monorepo) with separate frontend and backend directories.

---

## Directory Structure

```text
darul-quran/
├── package.json          # Root orchestration package configuration
├── README.md             # This documentation
├── backend/              # Standalone REST API service
│   ├── src/              # TypeScript source code (Fastify, node:sqlite)
│   ├── Dockerfile        # Production Docker configuration
│   └── package.json
└── frontend/             # Single-Page React Application
    ├── src/              # React components, contexts, and pages
    ├── vite.config.js    # Vite compilation & proxy config
    └── package.json
```

---

## Prerequisites

- **Node.js**: Version 22.5.0 or higher (required for native `node:sqlite` database bindings).
- **Docker**: Optional (for running the containerized backend).

---

## Setup & Local Development

### 1. Install Dependencies
At the root directory of the project, run:
```bash
npm install
```
*This will install all dependencies for the root, frontend, and backend projects collectively using NPM Workspaces.*

### 2. Configure Environment Variables
Inside the `frontend/` directory, verify or create the `.env.local` file:
```env
VITE_BASE44_APP_ID=your_app_id
```

### 3. Run Development Servers
To boot up both the Fastify backend (port 3000) and the Vite frontend dev server (port 5173) concurrently, run:
```bash
npm run dev
```
*The frontend automatically proxies `/api` requests to the backend server.*

---

## Production & Containerization

### Docker (Backend Only)
To build and run the backend service container:
```bash
# Build the Docker image
docker build -t darul-quran-backend ./backend

# Run the container (binds port 3000 and mounts volume for sqlite data persistence)
docker run -p 3000:3000 -v $(pwd)/backend/data:/app/data darul-quran-backend
```

### Production Build
To compile the typescript backend and build the static frontend bundle:
```bash
npm run build
```
