# Cloudflare AI Chat Agent

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/inkspill-cms-illustrative-ai-powered-blog-manager)

A production-ready, full-stack AI chat application powered by Cloudflare Workers and Agents. Features multi-session chat management, streaming responses, dynamic model switching, built-in tools (weather, web search), and extensible MCP (Model Context Protocol) tool support. Built with a modern React frontend using shadcn/ui for a polished, responsive experience.

## Features

- **Multi-Session Management**: Create, switch, rename, and delete persistent chat sessions with activity tracking.
- **Streaming Responses**: Real-time chat streaming for natural conversation flow.
- **Model Switching**: Support for Gemini models (Flash, Pro) via Cloudflare AI Gateway.
- **Tool Calling**: Built-in tools for weather lookup and web search (SerpAPI); extensible via MCP servers.
- **Session Persistence**: Durable Objects ensure conversations survive restarts.
- **Responsive UI**: Modern, mobile-friendly interface with dark/light theme support.
- **Error Handling & Observability**: Comprehensive logging, client error reporting, and Cloudflare Observability integration.
- **Type-Safe**: Full TypeScript coverage across frontend and Workers backend.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router, Zustand, Framer Motion
- **Backend**: Cloudflare Workers, Hono, Agents SDK, Durable Objects, OpenAI SDK (via Cloudflare AI Gateway)
- **Tools & Utils**: SerpAPI (web search), MCP SDK (extensible tools), Immer (state management)
- **Dev Tools**: Bun, Wrangler, ESLint, Tailwind, Vitest (ready for testing)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/)
- Cloudflare account with Workers enabled
- Cloudflare AI Gateway setup (for `@cf/meta/*` models) or API keys for `@google-ai-studio/*`
- Optional: SerpAPI key for web search

### Installation

```bash
git clone <your-repo-url>
cd <project-dir>
bun install
```

### Environment Setup

1. Copy `wrangler.jsonc` and update variables:
   ```json
   "vars": {
     "CF_AI_BASE_URL": "https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openai",
     "CF_AI_API_KEY": "{your_ai_gateway_token}",
     "SERPAPI_KEY": "{your_serpapi_key}",
     "OPENROUTER_API_KEY": "{optional_openrouter_key}"
   }
   ```
2. Generate types: `bun run cf-typegen`
3. Run `bun wrangler types` if needed for bindings.

### Local Development

```bash
# Start dev server (frontend + worker proxy)
bun dev

# In another terminal, deploy for preview (optional)
bun run deploy

# Preview production build
bun run preview
```

Access at `http://localhost:3000` (or `$PORT`).

### Linting & Formatting

```bash
bun lint    # ESLint
bun build   # Production build
```

## Usage

1. **Create Chat Session**:
   ```
   POST /api/sessions
   Body: { "title": "My Chat", "firstMessage": "Hello!" }
   ```

2. **Send Message** (streaming):
   ```
   POST /api/chat/{sessionId}/chat
   Body: { "message": "What's the weather in NYC?", "stream": true }
   ```

3. **List Sessions**: `GET /api/sessions`
4. **Delete Session**: `DELETE /api/sessions/{sessionId}`
5. **Switch Model**: `POST /api/chat/{sessionId}/model { "model": "google-ai-studio/gemini-2.5-pro" }`

Frontend handles all interactions automatically via `src/lib/chat.ts`.

**Tools Example**:
- `get_weather`: `{ "location": "London" }`
- `web_search`: `{ "query": "Cloudflare Workers" }`

## Deployment

Deploy to Cloudflare Workers with Pages asset bundling:

1. Ensure `wrangler.jsonc` vars are set (use Cloudflare dashboard secrets for prod).
2. Login: `wrangler login`
3. Deploy:
   ```bash
   bun run deploy  # Builds frontend + deploys worker
   ```
   Or: `wrangler deploy --outdir=dist`

4. Custom domain: `wrangler deploy --name my-chat-app`
5. Preview: `wrangler pages dev dist`

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/mikeschlottig/inkspill-cms-illustrative-ai-powered-blog-manager)

**Migrations**: Auto-handled via `wrangler.jsonc` for Durable Objects.

## Extending

- **Add Tools**: Extend `worker/tools.ts` or add MCP servers to `worker/mcp-client.ts`.
- **Custom Routes**: Add to `worker/userRoutes.ts`.
- **UI Components**: Use shadcn/ui (`npx shadcn@latest add <component>`).
- **Models**: Update `src/lib/chat.ts` MODELS array.

## Contributing

1. Fork & clone
2. `bun install`
3. Create feature branch: `git checkout -b feature/my-tool`
4. Commit: `git commit -m "Add my-tool support"`
5. Push & PR

Report issues via GitHub.

## License

MIT License. See [LICENSE](LICENSE) for details.

---

⭐ Built with [Cloudflare Workers](https://workers.cloudflare.com) & [Agents](https://developers.cloudflare.com/agents)