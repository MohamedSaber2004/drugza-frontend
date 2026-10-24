/**
 * CodeCraft API service (https://codecraftapi.com)
 * OpenAI-compatible endpoint: POST {base}/chat/completions, GET {base}/models
 */

export const CODECRAFT_API_KEY = 'cc_Hqm6hp5HQaBfxopEkAFxeFl8fLCwseJTYSXGXqDQq2ZFW42C';
export const CODECRAFT_BASE_URL = 'https://codecraftapi.com/v1';
export const CODECRAFT_MODEL = 'gemini-3.7-flash';

/** Reasoning models burn tokens before emitting content - leave headroom. */
const MAX_TOKENS = 2048;

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  model?: string;
  signal?: AbortSignal;
  /** Called with each streamed text fragment (streaming only). */
  onDelta?: (fullTextSoFar: string) => void;
}

export class CodeCraftError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'CodeCraftError';
    this.status = status;
  }
}

export const codecraftConfigured = CODECRAFT_API_KEY.length > 0;

const BASE_HEADERS = () => ({
  Authorization: `Bearer ${CODECRAFT_API_KEY}`,
  'Content-Type': 'application/json',
  Accept: 'application/json'
});

function buildError(status: number, raw: string): CodeCraftError {
  let detail = raw.slice(0, 300);
  try {
    const parsed = JSON.parse(raw);
    detail = parsed?.error?.message || parsed?.message || detail;
  } catch {
    /* keep raw snippet */
  }
  const hint =
    status === 401 || status === 403
      ? 'Invalid or revoked API key.'
      : status === 402
        ? 'Insufficient balance - top up your CodeCraft account.'
        : status === 429
          ? 'Rate limit reached - try again in a moment.'
          : status >= 500
            ? 'CodeCraft server error - try again shortly.'
            : '';
  return new CodeCraftError(hint ? `${hint} (${detail})` : detail || `Request failed (${status})`, status);
}

/**
 * Streaming chat completion (SSE). Returns the full assistant text.
 * `onDelta` receives the accumulated text after every chunk.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const model = options.model || CODECRAFT_MODEL;

  const res = await fetch(`${CODECRAFT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: BASE_HEADERS(),
    signal: options.signal,
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: MAX_TOKENS
    })
  });

  if (!res.ok) {
    throw buildError(res.status, await res.text().catch(() => ''));
  }

  // No streaming body support -> fall back to a normal request
  if (!res.body) {
    return chatCompletion(messages, options);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  const handleLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return false;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') return true;
    try {
      const json = JSON.parse(payload);
      const delta = json?.choices?.[0]?.delta;
      const fragment: string = delta?.content ?? '';
      if (fragment) {
        fullText += fragment;
        options.onDelta?.(fullText);
      }
    } catch {
      /* ignore malformed keep-alive lines */
    }
    return false;
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx = buffer.indexOf('\n');
      while (newlineIdx !== -1) {
        const line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (handleLine(line)) return fullText;
        newlineIdx = buffer.indexOf('\n');
      }
    }
    handleLine(buffer);
  } finally {
    reader.releaseLock();
  }

  return fullText;
}

/** Non-streaming chat completion. Used as fallback and for simple calls. */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const model = options.model || CODECRAFT_MODEL;

  try {
    const res = await fetch(`${CODECRAFT_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: BASE_HEADERS(),
      signal: options.signal,
      body: JSON.stringify({ model, messages, max_tokens: MAX_TOKENS })
    });

    if (!res.ok) {
      throw buildError(res.status, await res.text().catch(() => ''));
    }

    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? '';
    options.onDelta?.(text);
    return text;
  } catch (err) {
    if (err instanceof CodeCraftError) throw err;
    throw new CodeCraftError(err instanceof Error ? err.message : 'Network request failed');
  }
}

/** GET {base}/models - used to verify the key / show available models. */
export async function listModels(): Promise<string[]> {
  const res = await fetch(`${CODECRAFT_BASE_URL}/models`, {
    headers: BASE_HEADERS()
  });
  if (!res.ok) {
    throw buildError(res.status, await res.text().catch(() => ''));
  }
  const data = await res.json();
  return Array.isArray(data?.data) ? data.data.map((m: any) => m.id as string) : [];
}
