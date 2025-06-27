# DocFind Backend Server

This repository contains the backend server for my React Native app built with Expo. The backend is implemented using Deno and connects to a PostgreSQL database hosted on Neon. It features secure JWT-based endpoints, AI-powered chat and completion services, and structured logging.

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Architecture](#architecture)  
- [Prerequisites](#prerequisites)  
- [Installation](#installation)  
- [Configuration](#configuration)  
- [Running the Server](#running-the-server)  
- [Project Layout](#project-layout)  

## Overview

This backend server provides RESTful API endpoints that handle:  
- **User Authentication:** JWT validation via Auth0 middleware.  
- **Chat Management:** Create, update, delete chats; stream AI responses.  
- **AI Integration:** LangChain workflows for diagnosis, research, location, and general assistance.  
- **Data Persistence:** Drizzle ORM with PostgreSQL, plus LangGraph checkpoints.  
- **Structured Logging:** JSON logs with timestamps and levels.

## Features

- Secure JWT authentication middleware ([`verifyUserPermissions`](middlewares/Auth.middleware.ts))  
- Chat CRUD endpoints (`routes/chat/chat.route.ts`)  
- Stream-and-save AI completion endpoint (`routes/models/models.route.ts`)  
- LangChain graph workflow with tools, prompts, and state checkpointing (`langgraph/graph.ts`)  
- Drizzle ORM schema and migrations in `drizzle/`  
- Validators using Zod schemas (`types/ContextType.ts`, `middlewares/Model.middleware.ts`)  
- Unit tests for core utilities (e.g., [`utils/logger.ts`](utils/logger.ts))

## Architecture

- **Runtime:** Deno  
- **Framework:** Hono  
- **ORM:** Drizzle ORM + Zod  
- **Checkpointing:** LangGraph Postgres saver  
- **AI Models:** Mistral, Gemini, Fireworks via LangChain  
- **Tools:** Google Places, TavilySearch  
- **Logging:** Console JSON output with `LogLevel`

## Prerequisites

- [Deno](https://deno.land/#installation) (v2.2.3+)  
- [PostgreSQL](https://www.postgresql.org/download/)  
- Auth0 account for JWT issuer/audience  

## Installation

1. Clone the repo:  
   ```bash
   git clone https://github.com/your-org/doc-find-backend.git
   cd doc-find-backend
   ```
2. Install deps & generate lockfile (if needed):
   ```bash
   deno cache --lock=deno.lock --lock-write app.ts
   ```

## Configuration

Create a `.env` file in the project root with:

```bash
PORT=8000
DB_URL=postgres://user:password@localhost:5432/mydb
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=your-auth0-audience
GOOGLE_API_KEY=...
GOOGLE_PLACES_API_KEY=...
TAVILY_API_KEY=...
```

## Running the Server

Start in development mode:

```bash
deno run -A --watch index.ts
```

Or compile to a standalone binary:

```bash
deno task build
./server
```

## Project Layout

```
.
├── .env
├── deno.json          # Deno tasks & import map
├── drizzle.config.ts  # Drizzle migrations config
├── index.ts           # Deno.serve entrypoint
├── app.ts             # Hono app & routes
├── database/          # DB connection & LangGraph checkpointer
├── config/            # config scripts
├── drizzle/           # migrations & schema definitions
├── langgraph/         # LangChain graph & tools
├── middlewares/       # Auth & validation middleware
├── routes/            # Hono route handlers
│   ├── chat/
│   └── models/
├── services/          # Business logic & AI service
├── types/             # Zod/OpenAPI types & enums
├── utils/             # Logger & HTTP code enums
├── tests/             # Deno unit tests
└──
