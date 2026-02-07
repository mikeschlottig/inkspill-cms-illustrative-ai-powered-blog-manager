import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder, delay } from './utils';
const STORAGE_DOC_TITLE_KEY = 'document_title';
const STORAGE_DOC_CONTENT_KEY = 'document_content';
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  private pendingDocPersist: { title: string; content: string } | null = null;
  private docPersistSeq = 0;
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
    // Load persisted document fields safely (storage.get may return undefined).
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
        const nextTitle = typeof body.title === 'string' ? body.title : this.state.title;
        const nextContent = typeof body.content === 'string' ? body.content : this.state.content;
        this.setState({
          ...this.state,
          title: nextTitle,
          content: nextContent,
        });
        // Persist with a debounce-like background task guarded by a sequence.
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
    const seq = ++this.docPersistSeq;
    // Use waitUntil so the DO can finish the storage work even after the request completes.
    this.ctx.waitUntil(
      (async () => {
        try {
          await delay(700);
          if (seq !== this.docPersistSeq) return; // superseded by a newer write
          const payload = this.pendingDocPersist;
          if (!payload) return;
          this.pendingDocPersist = null;
          await Promise.all([
            this.ctx.storage.put(STORAGE_DOC_TITLE_KEY, payload.title),
            this.ctx.storage.put(STORAGE_DOC_CONTENT_KEY, payload.content),
          ]);
        } catch (error) {
          console.error('Failed to persist document fields:', error);
        }
      })()
    );
  }
  private async handleChatMessage(body: { message: string; model?: string; stream?: boolean }): Promise<Response> {
    const { message, model, stream } = body;
    if (!message?.trim()) {
      return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    }
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler?.updateModel(model);
    }
    const userMessage = createMessage('user', message.trim());
    this.setState({
      ...this.state,
      messages: [...this.state.messages, userMessage],
      isProcessing: true,
    });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            if (!this.chatHandler) throw new Error('Chat handler not initialized');
            let streaming = '';
            this.setState({ ...this.state, streamingMessage: '' });
            const response = await this.chatHandler.processMessage(
              message,
              this.state.messages,
              this.state.title,
              this.state.content,
              (chunk: string) => {
                streaming += chunk;
                // Avoid storing large streaming state forever; keep it for UI, cleared on completion.
                this.setState({ ...this.state, streamingMessage: streaming });
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
            try {
              writer.write(encoder.encode('Error processing stream.'));
            } catch (writeErr) {
              console.error('Failed to write stream error message:', writeErr);
            }
          } finally {
            try {
              writer.close();
            } catch (closeErr) {
              console.error('Failed to close stream writer:', closeErr);
            }
          }
        })();
        return createStreamResponse(readable);
      }
      if (!this.chatHandler) throw new Error('Chat handler not initialized');
      const response = await this.chatHandler.processMessage(message, this.state.messages, this.state.title, this.state.content);
      const assistantMessage = createMessage('assistant', response.content, response.toolCalls);
      this.setState({
        ...this.state,
        messages: [...this.state.messages, assistantMessage],
        isProcessing: false,
      });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      console.error('Chat handling error:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
}