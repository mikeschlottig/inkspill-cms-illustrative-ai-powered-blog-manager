import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
const STORAGE_DOC_TITLE_KEY = 'document_title';
const STORAGE_DOC_CONTENT_KEY = 'document_content';
export class ChatAgent extends Agent<Env, ChatState> {
  // `agents` wraps Durable Objects; declare `ctx` so we can use storage explicitly (persistence across restarts).
  declare ctx: DurableObjectState;
  private chatHandler?: ChatHandler;
  private docPersistTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingDocPersist: { title: string; content: string } | null = null;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.5-flash',
    title: '',
    content: '',
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(this.env.CF_AI_BASE_URL, this.env.CF_AI_API_KEY, this.state.model);
    // Load persisted document fields (database-grade durability via DO storage keys).
    try {
      const [storedTitle, storedContent] = await Promise.all([
        this.ctx.storage.get<string>(STORAGE_DOC_TITLE_KEY),
        this.ctx.storage.get<string>(STORAGE_DOC_CONTENT_KEY),
      ]);
      const nextTitle = typeof storedTitle === 'string' ? storedTitle : this.state.title;
      const nextContent = typeof storedContent === 'string' ? storedContent : this.state.content;
      if (nextTitle !== this.state.title || nextContent !== this.state.content) {
        this.setState({ ...this.state, title: nextTitle, content: nextContent });
      }
    } catch (error) {
      console.error('Failed to load persisted document fields:', error);
    }
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') {
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'POST' && url.pathname === '/chat') {
        const body = (await request.json()) as { message: string; model?: string; stream?: boolean };
        return this.handleChatMessage(body);
      }
      if (method === 'DELETE' && url.pathname === '/clear') {
        this.setState({ ...this.state, messages: [] });
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'POST' && url.pathname === '/model') {
        const body = (await request.json()) as { model: string };
        this.setState({ ...this.state, model: body.model });
        this.chatHandler?.updateModel(body.model);
        return Response.json({ success: true, data: this.state });
      }
      if (method === 'GET' && url.pathname === '/document') {
        return Response.json({
          success: true,
          data: { title: this.state.title, content: this.state.content },
        });
      }
      if (method === 'POST' && url.pathname === '/document') {
        const body = (await request.json()) as { title?: string; content?: string };
        const nextTitle = body.title ?? this.state.title;
        const nextContent = body.content ?? this.state.content;
        this.setState({
          ...this.state,
          title: nextTitle,
          content: nextContent,
        });
        // Persist to DO storage with a debounce to reduce write pressure while preserving durability.
        this.scheduleDocPersist(nextTitle, nextContent);
        return Response.json({ success: true });
      }
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private scheduleDocPersist(title: string, content: string): void {
    this.pendingDocPersist = { title, content };
    if (this.docPersistTimeout) clearTimeout(this.docPersistTimeout);
    this.docPersistTimeout = setTimeout(() => {
      const payload = this.pendingDocPersist;
      this.pendingDocPersist = null;
      this.docPersistTimeout = null;
      if (!payload) return;
      this.ctx.waitUntil(
        (async () => {
          try {
            await this.ctx.storage.put(STORAGE_DOC_TITLE_KEY, payload.title);
            await this.ctx.storage.put(STORAGE_DOC_CONTENT_KEY, payload.content);
          } catch (error) {
            console.error('Failed to persist document fields:', error);
          }
        })()
      );
    }, 700);
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model, stream } = body;
    if (!message?.trim()) return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    this.setState({ ...this.state, messages: [...this.state.messages, userMessage], isProcessing: true });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler!.processMessage(
              message,
              this.state.messages,
              this.state.title,
              this.state.content,
              (chunk: string) => {
                this.setState({ ...this.state, streamingMessage: (this.state.streamingMessage || '') + chunk });
                writer.write(encoder.encode(chunk));
              }
            );
            const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
            this.setState({
              ...this.state,
              messages: [...this.state.messages, assistantMessage],
              isProcessing: false,
              streamingMessage: '',
            });
          } catch (e) {
            console.error('Stream processing inner error:', e);
            writer.write(encoder.encode('Error processing stream.'));
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler!.processMessage(message, this.state.messages, this.state.title, this.state.content);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({ ...this.state, messages: [...this.state.messages, assistantMessage], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      console.error('Chat handling error:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
}