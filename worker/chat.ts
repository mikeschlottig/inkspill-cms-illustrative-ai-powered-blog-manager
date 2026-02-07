import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey,
    });
    this.model = model;
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    documentTitle?: string,
    documentContent?: string,
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory, documentTitle, documentContent);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 16000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, documentTitle, documentContent, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false,
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory, documentTitle, documentContent);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    documentTitle?: string,
    documentContent?: string,
    onChunk?: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk?.(delta.content);
        }
        if (delta?.tool_calls) {
          for (let i = 0; i < delta.tool_calls.length; i++) {
            const deltaToolCall = delta.tool_calls[i];
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: deltaToolCall.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: deltaToolCall.function?.name || '',
                  arguments: deltaToolCall.function?.arguments || '',
                },
              };
            } else {
              if (deltaToolCall.function?.name && !accumulatedToolCalls[i].function.name) {
                accumulatedToolCalls[i].function.name = deltaToolCall.function.name;
              }
              if (deltaToolCall.function?.arguments) {
                accumulatedToolCalls[i].function.arguments += deltaToolCall.function.arguments;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Stream processing failed');
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[],
    documentTitle?: string,
    documentContent?: string
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      return { content: 'I apologize, but I encountered an issue processing your request.' };
    }
    if (!responseMessage.tool_calls) {
      return {
        content: responseMessage.content || 'I apologize, but I encountered an issue.',
      };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, conversationHistory, responseMessage.tool_calls, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
            result,
          };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: {
              error: `Failed to execute ${tc.function.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const followUpCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content:
            'You are The Muse of InkSpill CMS. Speak warmly and clearly. Weave tool results into actionable guidance with a touch of poetic ink-and-parchment metaphor.',
        },
        ...history.slice(-3).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage },
        {
          role: 'assistant',
          content: null,
          tool_calls: openAiToolCalls,
        },
        ...toolResults.map((result, index) => ({
          role: 'tool' as const,
          content: JSON.stringify(result.result),
          tool_call_id: openAiToolCalls[index]?.id || result.id,
        })),
      ],
      max_tokens: 16000,
    });
    return followUpCompletion.choices[0]?.message?.content || 'Tool results processed successfully.';
  }
  private buildConversationMessages(userMessage: string, history: Message[], documentTitle?: string, documentContent?: string) {
    const systemPrompt = `You are **"The Muse"**, the resident ink-sprite and craft-savvy writing companion inside **InkSpill CMS**.
Your job is to help the author shape their sketch like an illustrator: with bold lines, clear structure, and delightful detail.
Speak with a supportive, slightly poetic voice—like quill on parchment—but keep advice practical and easy to apply.
Use metaphors of:
- ink, spills, stains, blotting paper
- parchment, margins, notebook scribbles
- quills, nibs, strokes, shading
- digital sketching, layers, composition, and layout
When giving SEO or optimization guidance, frame it as **creative spells** or **structural sketching**:
- keywords = "ink pigments"
- headings = "panel frames"
- internal links = "stitched bindings"
- meta description = "the label on the bottle"
Always provide 3–7 concrete, specific suggestions.
CURRENT SKETCH CONTEXT (your reference, not to be repeated verbatim unless asked):
Title: ${documentTitle || 'Untitled'}
Content: ${documentContent || 'Empty Canvas'}
Rules:
- If the sketch is empty or short, propose 2–3 starter strokes (hooks, outline, first paragraph).
- If asked for tags/keywords: give a prioritized list and explain why each fits.
- If asked for tone: name it, then suggest small edits (word swaps, sentence rhythm).
- Be kind; never scold. You are a lantern, not a judge.`;
    return [
      { role: 'system' as const, content: systemPrompt },
      ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ];
  }
  updateModel(newModel: string): void {
    this.model = newModel;
  }
}