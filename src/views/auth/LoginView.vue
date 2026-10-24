<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, ArrowRight, Globe, Home } from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const route = useRoute();
const { t, locale, toggleLocale } = useI18n();
const { login, isLoading, authError } = useAuth();

const emailOrPhone = ref('');
const password = ref('');
const showPassword = ref(false);

async function handleLogin() {
  const success = await login(emailOrPhone.value, password.value, true);
  if (success) {
    const target = (route.query.redirect as string) || '/';
    router.push(target);
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Top Bar with Return Home & Language Switcher -->
    <div class="auth-top-actions">
      <router-link to="/" class="auth-home-btn">
        <Home :size="16" />
        <span>{{ locale === 'ar' ? 'العودة للرئيسية' : 'Back to Home' }}</span>
      </router-link>

      <button type="button" class="auth-lang-btn" @click="toggleLocale">
        <Globe :size="16" />
        <span>{{ locale === 'ar' ? 'English' : 'اللغة العربية' }}</span>
      </button>
    </div>

    <div class="auth-card-container">
      <!-- Left Branded Showcase Panel (Matching UI Board Screen 2) -->
      <div class="auth-showcase-panel">
        <div class="showcase-top">
          <router-link to="/" class="logo-link" :title="locale === 'ar' ? 'العودة للصفحة الرئيسية' : 'Go to Home'">
            <DrugzaLogo size="md" :inverse="true" :show-tagline="true" />
          </router-link>
        </div>

        <div class="showcase-visual">
          <img
            src="/images/auth-pharmacy.jpg"
            alt="Drugza Certified Pharmacy Network"
            class="showcase-img"
          />
        </div>

        <div class="showcase-trust">
          <h3 class="trust-heading">{{ t('auth.trustedHeading') }}</h3>
          <ul class="trust-list">
            <li>
              <CheckCircle2 :size="16" class="trust-icon" />
              <span>{{ t('auth.directWholesale') }}</span>
            </li>
            <li>
              <CheckCircle2 :size="16" class="trust-icon" />
              <span>{{ t('auth.wideSelection') }}</span>
            </li>
            <li>
              <CheckCircle2 :size="16" class="trust-icon" />
              <span>{{ t('auth.sameDayColdChain') }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right Form Panel -->
      <div class="auth-form-panel">
        <div class="form-header">
          <h2 class="form-title">{{ t('auth.loginTitle') }}</h2>
          <p class="form-subtitle">{{ t('auth.loginSubtitle') }}</p>
        </div>

        <div v-if="authError" class="auth-error-banner" role="alert">
          {{ authError }}
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
          <!-- Email / Phone Input -->
          <div class="field-group">
            <label for="login-identifier" class="field-label">{{ t('auth.emailOrPhone') }}</label>
            <div class="input-container">
              <Mail :size="18" class="input-icon" />
              <input
                id="login-identifier"
                v-model="emailOrPhone"
                type="text"
                required
                :placeholder="t('auth.emailPlaceholder')"
                class="form-input"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="field-group">
            <div class="label-row">
              <label for="login-password" class="field-label">{{ t('auth.password') }}</label>
              <router-link to="/auth/forgot-password" class="forgot-link">
                {{ t('auth.forgotPasswordLink') }}
              </router-link>
            </div>
            <div class="input-container">
              <Lock :size="18" class="input-icon" />
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :placeholder="t('auth.passwordPlaceholder')"
                class="form-input"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="toggle-eye"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <EyeOff v-if="showPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>


          <!-- Primary Submit Button -->
          <Button
            variant="cta"
            size="lg"
            block
            type="submit"
            :loading="isLoading"
            class="submit-btn"
          >
            <span>{{ t('auth.loginBtn') }}</span>
            <ArrowRight :size="18" class="arrow-icon" />
          </Button>
        </form>

        <div class="auth-footer-prompt">
          <span>{{ t('auth.noAccountPrompt') }}</span>
          <router-link to="/auth/register" class="register-link">
            {{ t('auth.registerPharmacyLink') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-md);
  background: linear-gradient(135deg, #F0F6FA 0%, #E6F1F8 100%);
}

.auth-top-actions {
  width: 100%;
  max-width: 960px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.auth-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary-blue);
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast, 0.2s);
}

.auth-home-btn:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
  border-color: var(--color-primary-blue);
  transform: translateY(-1px);
}

.logo-link {
  text-decoration: none;
  display: inline-block;
  transition: transform 0.2s ease;
}

.logo-link:hover {
  transform: scale(1.02);
}

.auth-lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.auth-lang-btn:hover {
  background: var(--color-primary-blue-bg);
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
}

.auth-card-container {
  width: 100%;
  max-width: 960px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1.15fr;
}

@media (max-width: 860px) {
  .auth-card-container {
    grid-template-columns: 1fr;
  }
}

/* Left Showcase Panel */
.auth-showcase-panel {
  background: linear-gradient(145deg, #12496B 0%, #1976AD 100%);
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #FFFFFF;
}

@media (max-width: 860px) {
  .auth-showcase-panel {
    justify-content: flex-start;
    align-items: center;
    text-align: center;
    padding: var(--space-lg);
    gap: var(--space-md);
  }

  .showcase-visual {
    display: none;
  }

  .trust-heading {
    font-size: 1rem;
  }

  .trust-list {
    align-items: flex-start;
    text-align: start;
  }
}

.showcase-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--space-xl) 0;
}

.showcase-img {
  width: 100%;
  max-width: 260px;
  border-radius: var(--radius-xl);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.trust-heading {
  font-size: 1.125rem;
  color: #FFFFFF;
  line-height: 1.3;
  margin-bottom: var(--space-sm);
}

.trust-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trust-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.9);
}

.trust-icon {
  color: var(--color-accent-yellow);
  flex-shrink: 0;
}

/* Right Form Panel */
.auth-form-panel {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 540px) {
  .auth-form-panel {
    padding: var(--space-lg);
  }
}

.form-header {
  margin-bottom: var(--space-lg);
}

.form-title {
  font-size: 1.75rem;
  color: var(--color-deep-blue);
  line-height: 1.2;
}

.form-subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.auth-error-banner {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid rgba(220, 91, 97, 0.3);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  margin-bottom: var(--space-md);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
}

.forgot-link {
  font-size: 0.75rem;
  color: var(--color-primary-blue);
  font-weight: var(--font-weight-medium);
}

.forgot-link:hover {
  text-decoration: underline;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--color-text-tertiary);
  pointer-events: none;
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

.toggle-eye {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  padding: 4px;
  cursor: pointer;
}

.toggle-eye:hover {
  color: var(--color-deep-blue);
}


.submit-btn {
  margin-top: 4px;
}

.auth-footer-prompt {
  margin-top: var(--space-xl);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.register-link {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-blue);
  margin-left: 6px;
}

.register-link:hover {
  text-decoration: underline;
}

/* RTL Overrides */
[dir="rtl"] .input-icon {
  left: auto;
  right: 14px;
}

[dir="rtl"] .form-input {
  padding: 0 42px 0 40px;
}

[dir="rtl"] .toggle-eye {
  right: auto;
  left: 12px;
}

[dir="rtl"] .register-link {
  margin-left: 0;
  margin-right: 6px;
}

@media (max-width: 480px) {
  .auth-page {
    padding: var(--space-md) var(--space-xs);
  }
  .auth-form-panel {
    padding: var(--space-md) var(--space-sm);
  }
  .form-title {
    font-size: 1.4rem;
  }
  .form-subtitle {
    font-size: 0.8125rem;
  }
}
</style>
