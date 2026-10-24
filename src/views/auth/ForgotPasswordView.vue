<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const { forgotPassword, resetPassword, isLoading, authError } = useAuth();

const email = ref('');
const step = ref<'request' | 'reset' | 'completed'>('request');

// Reset inputs
const newPassword = ref('');
const confirmPassword = ref('');
const showPass = ref(false);

async function handleSendLink() {
  if (!email.value || !email.value.includes('@')) {
    toast.error('Please enter a valid pharmacy email address.');
    return;
  }
  const success = await forgotPassword(email.value.trim());
  if (success) {
    step.value = 'reset';
  }
}

async function handleResetPassword() {
  if (newPassword.value.length < 8) {
    toast.error('Password must be at least 8 characters long.');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.error('Passwords do not match.');
    return;
  }
  const success = await resetPassword(email.value.trim(), newPassword.value);
  if (success) {
    step.value = 'completed';
  }
}
</script>

<template>
  <div class="recovery-page">
    <div class="recovery-card">
      <div class="logo-box">
        <DrugzaLogo size="md" />
      </div>

      <div class="key-icon-box">
        <KeyRound :size="36" />
      </div>

      <div v-if="authError" class="auth-error-banner" role="alert">
        {{ authError }}
      </div>

      <!-- Step 1: Request Email -->
      <template v-if="step === 'request'">
        <h2 class="recovery-title">{{ t('auth.resetTitle') }}</h2>
        <p class="recovery-desc">
          {{ t('auth.resetSubtitle') }}
        </p>

        <form class="recovery-form" @submit.prevent="handleSendLink">
          <div class="field-group">
            <label class="field-label">{{ t('auth.email') }}</label>
            <div class="input-wrap">
              <Mail :size="18" class="field-ico" />
              <input
                v-model="email"
                type="email"
                required
                :placeholder="t('auth.emailPlaceholder')"
                class="form-input"
                autocomplete="email"
              />
            </div>
          </div>

          <Button
            variant="cta"
            size="lg"
            block
            type="submit"
            :loading="isLoading"
            class="action-btn"
          >
            <span>{{ t('auth.sendResetBtn') }}</span>
            <ArrowRight :size="18" class="arrow-icon" />
          </Button>
        </form>
      </template>

      <!-- Step 2: Set New Password -->
      <template v-else-if="step === 'reset'">
        <h2 class="recovery-title">{{ t('auth.createNewPassTitle') }}</h2>
        <p class="recovery-desc">
          {{ t('auth.createNewPassSubtitle', { email: email }) }}
        </p>

        <form class="recovery-form" @submit.prevent="handleResetPassword">
          <div class="field-group">
            <label class="field-label">{{ t('auth.newPass') }}</label>
            <div class="input-wrap">
              <Lock :size="18" class="field-ico" />
              <input
                v-model="newPassword"
                :type="showPass ? 'text' : 'password'"
                required
                placeholder="At least 8 characters"
                class="form-input"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="eye-btn"
                @click="showPass = !showPass"
              >
                <EyeOff v-if="showPass" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">{{ t('auth.confirmNewPass') }}</label>
            <div class="input-wrap">
              <Lock :size="18" class="field-ico" />
              <input
                v-model="confirmPassword"
                :type="showPass ? 'text' : 'password'"
                required
                placeholder="Re-enter new password"
                class="form-input"
                autocomplete="new-password"
              />
            </div>
          </div>

          <!-- Password strength hints -->
          <div class="strength-meter">
            <div class="bars">
              <span class="bar" :class="{ active: newPassword.length >= 6 }"></span>
              <span class="bar" :class="{ active: newPassword.length >= 8 }"></span>
              <span class="bar" :class="{ active: newPassword.length >= 10 }"></span>
            </div>
            <span class="strength-text">
              {{ newPassword.length < 8 ? t('auth.min8Chars') : t('auth.strongPass') }}
            </span>
          </div>

          <Button
            variant="cta"
            size="lg"
            block
            type="submit"
            :loading="isLoading"
            class="action-btn"
          >
            <span>{{ t('auth.resetPassBtn') }}</span>
            <ArrowRight :size="18" class="arrow-icon" />
          </Button>
        </form>
      </template>

      <!-- Step 3: Success -->
      <template v-else>
        <div class="success-box">
          <CheckCircle2 :size="48" class="success-check" />
          <h2 class="recovery-title">{{ t('auth.resetCompleted') }}</h2>
          <p class="recovery-desc">
            {{ t('auth.resetCompletedDesc') }}
          </p>

          <Button
            variant="cta"
            size="lg"
            block
            @click="router.push('/auth/login')"
          >
            {{ t('auth.proceedToLogin') }}
          </Button>
        </div>
      </template>

      <div class="recovery-footer">
        <router-link to="/auth/login" class="back-link">
          &larr; {{ t('auth.returnToSignIn') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recovery-page {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  background-color: var(--color-off-white);
}

.recovery-card {
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

.key-icon-box {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-pill);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
  box-shadow: 0 4px 16px rgba(25, 118, 173, 0.12);
}

.recovery-title {
  font-size: 1.625rem;
  color: var(--color-deep-blue);
  margin-bottom: var(--space-2xs);
}

.recovery-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-xl);
}

.recovery-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-ico {
  position: absolute;
  left: 14px;
  color: var(--color-text-tertiary);
}

.form-input {
  width: 100%;
  height: 46px;
  padding: 0 40px 0 42px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--color-off-white);
  outline: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.form-input:focus {
  border-color: var(--color-primary-blue);
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(25, 118, 173, 0.12);
}

.eye-btn {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.strength-meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.bars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.bar {
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-pill);
}

.bar.active {
  background: var(--color-success);
}

.strength-text {
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
}

.action-btn {
  margin-top: var(--space-xs);
}

.success-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
}

.success-check {
  color: var(--color-success);
}

.recovery-footer {
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

.auth-error-banner {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background-color: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: var(--radius-md);
  color: #B91C1C;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: var(--space-md);
  text-align: center;
}

/* RTL Overrides */
[dir="rtl"] .field-ico {
  left: auto;
  right: 14px;
}

[dir="rtl"] .form-input {
  padding: 0 42px 0 40px;
}

[dir="rtl"] .eye-btn {
  right: auto;
  left: 12px;
}

[dir="rtl"] .field-group,
[dir="rtl"] .strength-meter {
  text-align: right;
}

@media (max-width: 480px) {
  .recovery-page {
    padding: var(--space-md) var(--space-xs);
  }
  .recovery-card {
    padding: var(--space-lg) var(--space-sm);
  }
  .recovery-title {
    font-size: 1.35rem;
  }
}
</style>
