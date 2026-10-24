import { ref, computed, reactive } from 'vue';
import { streamChatCompletion, CodeCraftError, type ChatMessage } from '@/services/codecraft.service';
import { useI18n } from './useI18n';

export interface AssistantMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

/** Keep context bounded so each request stays cheap. */
const MAX_HISTORY_MESSAGES = 20;

/** Module-level singleton so the widget keeps its history across route changes. */
const isOpen = ref(false);
const messages = ref<AssistantMessage[]>([]);
const isSending = ref(false);
const errorKey = ref<string | null>(null);

let idCounter = 0;
let abortController: AbortController | null = null;

export function useAiAssistant() {
  const { t, locale, isRtl } = useI18n();

  const errorText = computed(() => (errorKey.value ? t(errorKey.value) : null));

  const suggestionKeys = ['assistant.suggest1', 'assistant.suggest2', 'assistant.suggest3'];

  const suggestions = computed(() => suggestionKeys.map((k) => t(k)));

  function buildSystemPrompt(): string {
    const langLine =
      locale.value === 'ar'
        ? 'اكتب ردودك باللغة العربية بالكامل.'
        : 'Always reply in English.';

    return [
      'You are the Drugza Assistant, the in-app help assistant for Drugza — an Egyptian B2B pharmaceutical marketplace where licensed pharmacies order medicines and medical supplies from authorized distributors.',
      langLine,
      'Keep answers concise (max ~120 words), friendly and professional. Use short paragraphs or bullet lists.',
      'You can help with: how to place an order, the cart and minimum order quantities, delivery and cold-chain shipping (15–25°C), order tracking, returns, pharmacy registration, payments and invoices, and how to browse the catalog.',
      'Never invent product prices, stock levels, discount amounts or order statuses — if asked, tell the user to search the catalog, open Order History, or contact support desk.',
      'Do not give dosage, prescription or medical advice; recommend consulting a pharmacist or physician.',
      'All prices are in Egyptian Pounds (EGP).'
    ].join('\n');
  }

  function mapError(err: unknown): string | null {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null; // user pressed stop - not an error
    }
    if (err instanceof CodeCraftError) {
      if (err.status === 401 || err.status === 403) return 'assistant.errors.auth';
      if (err.status === 402) return 'assistant.errors.balance';
      if (err.status === 429) return 'assistant.errors.rate';
      if (err.status && err.status >= 500) return 'assistant.errors.server';
      return 'assistant.errors.generic';
    }
    if (err instanceof TypeError) return 'assistant.errors.network';
    return 'assistant.errors.generic';
  }

  async function send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || isSending.value) return;

    errorKey.value = null;
    messages.value.push({ id: ++idCounter, role: 'user', content });

    // reactive() so streamed .content mutations re-render the bubble
    const assistantMsg: AssistantMessage = reactive({ id: ++idCounter, role: 'assistant', content: '', pending: true });
    messages.value.push(assistantMsg);

    const history: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...messages.value
        .filter((m) => m.content.trim() !== '')
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }))
    ];

    isSending.value = true;
    abortController = new AbortController();

    try {
      const full = await streamChatCompletion(history, {
        signal: abortController.signal,
        onDelta: (text) => {
          assistantMsg.content = text;
        }
      });

      if (!full.trim()) {
        throw new CodeCraftError('Empty response');
      }
      assistantMsg.content = full;
    } catch (err) {
      const key = mapError(err);
      const idx = messages.value.findIndex((m) => m.id === assistantMsg.id);

      if (key === null) {
        // User pressed stop: keep whatever streamed in, drop an empty bubble.
        if (idx !== -1 && !assistantMsg.content.trim()) messages.value.splice(idx, 1);
      } else {
        // Failure: drop the empty bubble, keep the user's message so they can retry.
        if (idx !== -1) messages.value.splice(idx, 1);
        errorKey.value = key;
      }
    } finally {
      assistantMsg.pending = false;
      isSending.value = false;
      abortController = null;
    }
  }

  /** Re-send the last user message after an error. */
  function retry(): void {
    if (isSending.value) return;
    const last = [...messages.value].reverse().find((m) => m.role === 'user');
    if (!last) return;
    const idx = messages.value.findIndex((m) => m.id === last.id);
    messages.value.splice(idx, 1);
    errorKey.value = null;
    void send(last.content);
  }

  function stop(): void {
    abortController?.abort();
  }

  function clear(): void {
    messages.value = [];
    errorKey.value = null;
  }

  function open(): void {
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  return {
    isOpen,
    messages,
    isSending,
    errorText,
    suggestions,
    isRtl,
    send,
    retry,
    stop,
    clear,
    open,
    close,
    toggle
  };
}
