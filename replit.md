# Workspace

## Overview

pnpm workspace monorepo using TypeScript. A real-time Chat App with Socket.IO.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Real-time**: Socket.IO (WebSocket)
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, wouter

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- User login/signup (username + password)
- Real-time messaging via Socket.IO
- Online/offline status indicators
- Message timestamps
- Chat list with recent conversations and unread badges
- Typing indicator ("X is typing...")
- Read receipts (✓✓ seen)
- Group chat support
- Direct messages

## Demo Users

- sneha / demo123
- arjun / demo123
- priya / demo123

## Architecture

- `artifacts/chat-app/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 backend with Socket.IO
- `lib/db/` — Drizzle ORM schema (users, conversations, messages, message_reads)
- `lib/api-spec/openapi.yaml` — API contract
- `lib/api-client-react/` — Generated React Query hooks

## Socket.IO Events

Server → Client: `new_message`, `typing_start`, `typing_stop`, `user_online`, `user_offline`, `message_read`
Client → Server: `join_conversation`, `leave_conversation`, `typing_start`, `typing_stop`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
