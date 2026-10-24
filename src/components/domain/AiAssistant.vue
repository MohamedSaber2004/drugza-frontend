<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';
import { MessageCircle, X, Send, Square, Trash2, Sparkles, RotateCcw, Bot } from 'lucide-vue-next';
import { useAiAssistant } from '@/composables/useAiAssistant';
import { useI18n } from '@/composables/useI18n';
import { CODECRAFT_MODEL } from '@/services/codecraft.service';

const { t } = useI18n();
const {
  isOpen,
  messages,
  isSending,
  errorText,
  suggestions,
  send,
  retry,
  stop,
  clear,
  close,
  toggle
} = useAiAssistant();

const draft = ref('');
const inputEl = ref<HTMLTextAreaElement | null>(null);
const scrollEl = ref<HTMLElement | null>(null);

const canSend = computed(() => draft.value.trim().length > 0 && !isSending.value);

// Scroll to the newest message whenever content grows
const lastContent = computed(() => {
  const last = messages.value[messages.value.length - 1];
  return `${messages.value.length}:${last?.content.length ?? 0}`;
});

watch(lastContent, async () => {
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
});

watch(isOpen, async (open) => {
  if (open) {
    await nextTick();
    inputEl.value?.focus();
  }
});

function handleSubmit() {
  if (!canSend.value) return;
  const text = draft.value;
  draft.value = '';
  autoGrow();
  void send(text);
}

function autoGrow() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === 'k' && (e.ctrlKey || e.metaKey) && isOpen.value) {
    e.preventDefault();
    close();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <!-- Floating Action Button -->
  <button
    type="button"
    class="ai-fab"
    :aria-label="isOpen ? t('assistant.close') : t('assistant.open')"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    <X v-if="isOpen" :size="24" />
    <Sparkles v-else :size="24" />
    <span v-if="!isOpen && !isSending" class="ai-fab-pulse" aria-hidden="true"></span>
  </button>

  <!-- Chat Panel -->
  <Transition name="ai-panel">
    <section
      v-if="isOpen"
      class="ai-panel"
      role="dialog"
      :aria-label="t('assistant.title')"
    >
      <!-- Header -->
      <header class="ai-header">
        <div class="ai-header-info">
          <div class="ai-avatar">
            <Bot :size="20" />
          </div>
          <div class="ai-header-text">
            <h3 class="ai-title">{{ t('assistant.title') }}</h3>
            <span class="ai-subtitle">
              <span v-if="isSending" class="ai-typing-label">{{ t('assistant.thinking') }}</span>
              <span v-else>{{ t('assistant.subtitle') }}</span>
            </span>
          </div>
        </div>
        <div class="ai-header-actions">
          <button
            v-if="messages.length > 0"
            type="button"
            class="ai-icon-btn"
            :aria-label="t('assistant.newChat')"
            :title="t('assistant.newChat')"
            @click="clear"
          >
            <Trash2 :size="16" />
          </button>
          <button
            type="button"
            class="ai-icon-btn"
            :aria-label="t('assistant.close')"
            :title="t('assistant.close')"
            @click="close"
          >
            <X :size="18" />
          </button>
        </div>
      </header>

      <!-- Messages -->
      <div ref="scrollEl" class="ai-body">
        <!-- Empty state -->
        <div v-if="messages.length === 0" class="ai-empty">
          <div class="ai-empty-icon">
            <Sparkles :size="26" />
          </div>
          <h4>{{ t('assistant.greetingTitle') }}</h4>
          <p>{{ t('assistant.greetingBody') }}</p>

          <div class="ai-suggestions">
            <button
              v-for="s in suggestions"
              :key="s"
              type="button"
              class="ai-chip"
              :disabled="isSending"
              @click="send(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Message list -->
        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="ai-row"
            :class="msg.role === 'user' ? 'is-user' : 'is-assistant'"
          >
            <div v-if="msg.role === 'assistant'" class="ai-bubble-icon" aria-hidden="true">
              <Bot :size="14" />
            </div>
            <div class="ai-bubble" :class="{ 'is-pending': msg.pending }">
              <template v-if="msg.pending && msg.content === ''">
                <span class="ai-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              </template>
              <template v-else>
                <span class="ai-text">{{ msg.content }}</span>
                <span v-if="msg.pending" class="ai-caret" aria-hidden="true"></span>
              </template>
            </div>
          </div>
        </template>

        <!-- Error banner -->
        <div v-if="errorText" class="ai-error" role="alert">
          <span class="ai-error-text">{{ errorText }}</span>
          <button type="button" class="ai-retry" @click="retry">
            <RotateCcw :size="13" />
            <span>{{ t('assistant.retry') }}</span>
          </button>
        </div>
      </div>

      <!-- Composer -->
      <footer class="ai-composer">
        <textarea
          ref="inputEl"
          v-model="draft"
          class="ai-input"
          rows="1"
          :placeholder="t('assistant.placeholder')"
          :aria-label="t('assistant.placeholder')"
          :disabled="isSending"
          @input="autoGrow"
          @keydown.enter.exact.prevent="handleSubmit"
        ></textarea>

        <button
          v-if="isSending"
          type="button"
          class="ai-send is-stop"
          :aria-label="t('assistant.stop')"
          :title="t('assistant.stop')"
          @click="stop"
        >
          <Square :size="15" />
        </button>
        <button
          v-else
          type="button"
          class="ai-send"
          :aria-label="t('assistant.send')"
          :title="t('assistant.send')"
          :disabled="!canSend"
          @click="handleSubmit"
        >
          <Send :size="16" />
        </button>
      </footer>

      <p class="ai-disclaimer">{{ t('assistant.disclaimer') }} &bull; {{ CODECRAFT_MODEL }}</p>
    </section>
  </Transition>
</template>

<style scoped>
/* ---------- FAB ---------- */
.ai-fab {
  position: fixed;
  bottom: 24px;
  inset-inline-end: 24px;
  z-index: 1100;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(25, 118, 173, 0.4);
  transition: all var(--dur-base) var(--ease-smooth);
}

.ai-fab:hover {
  background: var(--color-primary-blue-hover);
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(25, 118, 173, 0.45);
}

.ai-fab:focus-visible {
  outline: 2px solid var(--color-accent-yellow);
  outline-offset: 3px;
}

.ai-fab-pulse {
  position: absolute;
  top: 6px;
  inset-inline-end: 6px;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-yellow);
  border: 2px solid var(--color-primary-blue);
  animation: aiPulse 2.4s ease-in-out infinite;
}

@keyframes aiPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.7; }
}

/* ---------- Panel ---------- */
.ai-panel {
  position: fixed;
  bottom: 92px;
  inset-inline-end: 24px;
  z-index: 1100;
  width: min(392px, calc(100vw - 32px));
  height: min(600px, calc(100dvh - 140px));
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: all var(--dur-base) var(--ease-smooth);
}

.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* ---------- Header ---------- */
.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xs);
  padding: var(--space-sm);
  background: var(--color-deep-blue);
  color: #fff;
}

.ai-header-info {
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  min-width: 0;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.ai-header-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.ai-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.ai-subtitle {
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.ai-typing-label {
  color: var(--color-accent-yellow);
}

.ai-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ai-icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur-fast) var(--ease-smooth);
}

.ai-icon-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}

.ai-icon-btn:focus-visible {
  outline: 2px solid var(--color-accent-yellow);
  outline-offset: 2px;
}

/* ---------- Body ---------- */
.ai-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm);
  background: var(--color-off-white);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.ai-empty {
  margin: auto 0;
  text-align: center;
  padding: var(--space-md) var(--space-2xs);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xs);
}

.ai-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-empty h4 {
  font-size: var(--font-size-base);
  color: var(--color-deep-blue);
}

.ai-empty p {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  max-width: 280px;
  line-height: var(--line-height-normal);
}

.ai-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: var(--space-2xs);
}

.ai-chip {
  width: 100%;
  padding: 9px 12px;
  font-size: var(--font-size-xs);
  font-family: var(--font-body);
  color: var(--color-deep-blue);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: start;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.ai-chip:hover:not(:disabled) {
  border-color: var(--color-primary-blue);
  background: var(--color-primary-blue-light);
}

.ai-chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ---------- Messages ---------- */
.ai-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 100%;
}

.ai-row.is-user {
  justify-content: flex-end;
}

.ai-bubble-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-bubble {
  padding: 8px 12px;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
  border-radius: var(--radius-md);
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 78%;
}

.ai-row.is-assistant .ai-bubble {
  background: var(--color-white);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-start-start-radius: var(--radius-xs);
}

.ai-row.is-user .ai-bubble {
  background: var(--color-primary-blue);
  color: #fff;
  border-start-end-radius: var(--radius-xs);
}

.ai-bubble.is-pending {
  min-width: 56px;
}

.ai-caret {
  display: inline-block;
  width: 6px;
  height: 12px;
  margin-inline-start: 3px;
  background: var(--color-primary-blue);
  vertical-align: text-bottom;
  animation: aiBlink 0.9s steps(2) infinite;
}

@keyframes aiBlink {
  50% { opacity: 0; }
}

.ai-dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 14px;
}

.ai-dots i {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-text-tertiary);
  animation: aiDot 1.2s ease-in-out infinite;
}

.ai-dots i:nth-child(2) { animation-delay: 0.15s; }
.ai-dots i:nth-child(3) { animation-delay: 0.3s; }

@keyframes aiDot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ---------- Error ---------- */
.ai-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2xs);
  flex-wrap: wrap;
  padding: 8px 10px;
  background: var(--color-error-bg);
  border: 1px solid rgba(220, 91, 97, 0.35);
  border-radius: var(--radius-sm);
}

.ai-error-text {
  font-size: var(--font-size-xs);
  color: var(--color-error);
  line-height: var(--line-height-snug);
}

.ai-retry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  font-family: var(--font-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-error);
  background: #fff;
  border: 1px solid rgba(220, 91, 97, 0.4);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.ai-retry:hover {
  background: var(--color-error);
  color: #fff;
}

/* ---------- Composer ---------- */
.ai-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: var(--space-2xs) var(--space-sm) 6px;
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
}

.ai-input {
  flex: 1;
  resize: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-off-white);
  padding: 10px 12px;
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-snug);
  color: var(--color-text-primary);
  max-height: 96px;
  transition: border-color var(--dur-fast) var(--ease-smooth), background var(--dur-fast) var(--ease-smooth);
}

.ai-input::placeholder {
  color: var(--color-text-tertiary);
}

.ai-input:focus {
  outline: none;
  border-color: var(--color-border-focus);
  background: var(--color-white);
}

.ai-input:disabled {
  opacity: 0.7;
}

.ai-send {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.ai-send:hover:not(:disabled) {
  background: var(--color-primary-blue-hover);
}

.ai-send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-send.is-stop {
  background: var(--color-error);
}

.ai-send.is-stop:hover {
  background: #c7474d;
}

.ai-send:focus-visible {
  outline: 2px solid var(--color-accent-yellow);
  outline-offset: 2px;
}

/* Mirror the send arrow in Arabic (RTL) */
[dir="rtl"] .ai-send svg {
  transform: scaleX(-1);
}

.ai-disclaimer {
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 0 var(--space-sm) 7px;
  background: var(--color-white);
  margin: 0;
}

/* ---------- Responsive ---------- */
@media (max-width: 480px) {
  .ai-panel {
    inset-inline: 8px;
    bottom: 84px;
    width: auto;
    height: min(72dvh, calc(100dvh - 120px));
  }

  .ai-fab {
    bottom: 16px;
    inset-inline-end: 16px;
    width: 50px;
    height: 50px;
  }
}
</style>
