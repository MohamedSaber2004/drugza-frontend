<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ShieldCheck, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const { t } = useI18n();
const { verifyOtp, resendOtp, isLoading, authError } = useAuth();

const email = ref((route.query.email as string) || '');
const digits = ref<string[]>(['', '', '', '', '', '']);
const inputRefs = ref<HTMLInputElement[]>([]);

// Countdown timer
const countdown = ref(60);
let timer: any = null;

const isComplete = computed(() => digits.value.every(d => d.length === 1));

onMounted(() => {
  startTimer();
  inputRefs.value[0]?.focus();
});

function startTimer() {
  countdown.value = 60;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(timer);
    }
  }, 1000);
}

function handleInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const val = target.value;

  if (val.length > 1) {
    digits.value[index] = val.slice(-1);
  }

  if (digits.value[index] && index < 5) {
    inputRefs.value[index + 1]?.focus();
  }
}

function handleKeyDown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    digits.value[index - 1] = '';
    inputRefs.value[index - 1]?.focus();
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault();
  const pasteData = event.clipboardData?.getData('text') || '';
  const cleaned = pasteData.replace(/\D/g, '').slice(0, 6);
  if (cleaned) {
    const chars = cleaned.split('');
    chars.forEach((c, i) => {
      if (i < 6) digits.value[i] = c;
    });
    const focusIndex = Math.min(chars.length, 5);
    inputRefs.value[focusIndex]?.focus();
  }
}

async function handleVerify() {
  const fullCode = digits.value.join('');
  if (fullCode.length !== 6) {
    toast.error('Please enter all 6 digits of the verification code.');
    return;
  }

  if (!email.value) {
    toast.error('Email address is missing. Please go back to registration.');
    return;
  }

  const success = await verifyOtp(email.value, fullCode);
  if (success) {
    router.push({ path: '/auth/login', query: { email: email.value, verified: '1' } });
  }
}

async function handleResend() {
  if (!email.value) {
    toast.error('Email address is missing. Please go back to registration.');
    return;
  }
  const success = await resendOtp(email.value);
  if (success) {
    startTimer();
  }
}
</script>

<template>
  <div class="otp-page">
    <div class="otp-card">
      <div class="logo-box">
        <DrugzaLogo size="md" />
      </div>

      <!-- Icon & Header -->
      <div class="otp-shield-icon">
        <ShieldCheck :size="40" class="shield-svg" />
      </div>

      <h2 class="otp-title">{{ t('auth.verifyOtpTitle') }}</h2>
      <p class="otp-desc">
        {{ t('auth.verifyOtpSubtitle') }}
        <strong class="email-highlight">{{ email }}</strong>
      </p>

      <div v-if="authError" class="auth-error-banner" role="alert">
        {{ authError }}
      </div>

      <!-- 6 Segmented Inputs -->
      <div class="digits-row" @paste="handlePaste">
        <input
          v-for="(_, index) in digits"
          :key="index"
          :ref="el => inputRefs[index] = el as HTMLInputElement"
          v-model="digits[index]"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="digit-box"
          :class="{ 'is-filled': digits[index] }"
          @input="handleInput(index, $event)"
          @keydown="handleKeyDown(index, $event)"
        />
      </div>

      <!-- Submit Action -->
      <Button
        variant="cta"
        size="lg"
        block
        :disabled="!isComplete"
        :loading="isLoading"
        class="verify-btn"
        @click="handleVerify"
      >
        <span>{{ t('auth.verifyBtn') }}</span>
        <ArrowRight :size="18" class="arrow-icon" />
      </Button>

      <!-- Resend & Shortcut -->
      <div class="resend-section">
        <span v-if="countdown > 0" class="countdown-text">
          {{ t('auth.resendIn') }} <strong>00:{{ String(countdown).padStart(2, '0') }}</strong>
        </span>
        <button
          v-else
          type="button"
          class="resend-btn"
          @click="handleResend"
        >
          <RotateCw :size="14" />
          <span>{{ t('auth.resendBtn') }}</span>
        </button>
      </div>

      <div class="otp-footer">
        <router-link to="/auth/login" class="back-link">
          &larr; {{ t('auth.backToLogin') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.otp-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  background-color: var(--color-off-white);
}

.otp-card {
  width: 100%;
  max-width: 480px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-box {
  margin-bottom: var(--space-lg);
}

.otp-shield-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue-light);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
  box-shadow: 0 4px 16px rgba(25, 118, 173, 0.15);
}

.otp-title {
  font-size: 1.625rem;
  color: var(--color-deep-blue);
  margin-bottom: var(--space-2xs);
}

.otp-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-xl);
}

.email-highlight {
  display: block;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-bold);
  margin-top: 4px;
}

.auth-error-banner {
  width: 100%;
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid rgba(220, 91, 97, 0.3);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  margin-bottom: var(--space-md);
}

/* 6 Digits */
.digits-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: var(--space-xl);
  width: 100%;
  direction: ltr !important;
}

.digit-box {
  width: 52px;
  height: 60px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-off-white);
  text-align: center;
  font-family: var(--font-display);
  font-size: 1.625rem;
  font-weight: var(--font-weight-extrabold);
  color: var(--color-deep-blue);
  outline: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.digit-box:focus {
  border-color: var(--color-primary-blue);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(25, 118, 173, 0.15);
  transform: translateY(-2px);
}

.digit-box.is-filled {
  border-color: var(--color-primary-blue);
  background: #FFFFFF;
}

@media (max-width: 480px) {
  .otp-page {
    padding: var(--space-md) var(--space-xs);
  }
  .otp-card {
    padding: var(--space-lg) var(--space-sm);
  }
  .otp-title {
    font-size: 1.35rem;
  }
}

@media (max-width: 440px) {
  .digit-box {
    width: 38px;
    height: 48px;
    font-size: 1.25rem;
  }
  .digits-row {
    gap: 4px;
  }
}

.verify-btn {
  margin-bottom: var(--space-lg);
}

.resend-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.resend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

.demo-fill-link {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  text-decoration: underline;
  cursor: pointer;
  margin-top: 4px;
}
.demo-fill-link:hover {
  color: var(--color-primary-blue);
}

.otp-footer {
  margin-top: var(--space-xl);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
  width: 100%;
}

.back-link {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.back-link:hover {
  color: var(--color-primary-blue);
}
</style>
