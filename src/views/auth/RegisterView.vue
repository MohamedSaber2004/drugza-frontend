<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  Building,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Globe,
  Home,
  ChevronDown
} from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import Button from '@/components/ui/Button.vue';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';
import { addressService, type CountryDto, type CityDto, type AreaDto } from '@/services/address.service';

const router = useRouter();
const { t, locale, toggleLocale } = useI18n();
const { register, isLoading, authError } = useAuth();

const fullName = ref('');
const businessName = ref('');
const email = ref('');
const phoneNumber = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const agreeTerms = ref(false);

const countries = ref<CountryDto[]>([]);
const cities = ref<CityDto[]>([]);
const areas = ref<AreaDto[]>([]);
const areaZones = ref<Array<{ id: number; name: string }>>([]);
const countryId = ref<number | null>(null);
const cityId = ref<number | null>(null);
const areaId = ref<number | null>(null);
const streetAddress = ref('');
const isLoadingLocations = ref(false);
const countriesLoaded = ref(false);

async function loadCountries() {
  if (countriesLoaded.value || isLoadingLocations.value) return;
  isLoadingLocations.value = true;
  try {
    countries.value = await addressService.getAllCountries();
    countriesLoaded.value = true;
  } finally {
    isLoadingLocations.value = false;
  }
}

async function onCountryChange() {
  cities.value = [];
  areas.value = [];
  areaZones.value = [];
  cityId.value = null;
  areaId.value = null;
  if (!countryId.value) return;

  isLoadingLocations.value = true;
  try {
    cities.value = await addressService.getCities(countryId.value);
  } finally {
    isLoadingLocations.value = false;
  }
}

async function onCityChange() {
  areas.value = [];
  areaZones.value = [];
  areaId.value = null;
  if (!cityId.value) return;

  isLoadingLocations.value = true;
  try {
    areas.value = await addressService.getAreas(cityId.value);
  } finally {
    isLoadingLocations.value = false;
  }
}

async function onAreaChange() {
  areaZones.value = [];
  if (!areaId.value) return;
  areaZones.value = await addressService.getZonesByArea(areaId.value);
}

const formErrorMessage = ref<string | null>(null);

async function handleRegister() {
  formErrorMessage.value = null;

  if (password.value !== confirmPassword.value) {
    formErrorMessage.value = t('auth.passwordsDoNotMatch');
    return;
  }

  if (!agreeTerms.value) {
    formErrorMessage.value = t('auth.mustAgreeTerms');
    return;
  }

  if (!countryId.value || !cityId.value || !areaId.value) {
    formErrorMessage.value = t('auth.addressFieldsRequired');
    return;
  }

  if (!streetAddress.value.trim()) {
    formErrorMessage.value = t('auth.streetAddressRequired');
    return;
  }

  let zones = areaZones.value;
  if (zones.length === 0 && areaId.value) {
    zones = await addressService.getZonesByArea(areaId.value);
  }

  const formData = new FormData();
  formData.append('FullName', fullName.value.trim());
  formData.append('BussinesName', businessName.value.trim());
  formData.append('Email', email.value.trim());
  formData.append('PhoneNumber', phoneNumber.value.trim());
  formData.append('Password', password.value);
  formData.append('Role', 'Pharmacy');
  formData.append('CountryId', String(countryId.value));
  formData.append('CityId', String(cityId.value));
  formData.append('AreaId', String(areaId.value));
  formData.append('AddressLines[0]', streetAddress.value.trim());
  zones.forEach((zone, index) => {
    formData.append(`ZoneId[${index}]`, String(zone.id));
  });

  const res = await register(formData);
  if (res.success) {
    router.push({ path: '/auth/login', query: { email: res.email, registered: '1' } });
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Top Bar with Return Home & Language Switcher -->
    <div class="auth-top-actions">
      <router-link to="/" class="auth-home-btn">
        <Home :size="16" />
        <span>{{ t('common.backToHome') }}</span>
      </router-link>

      <button type="button" class="auth-lang-btn" @click="toggleLocale">
        <Globe :size="16" />
        <span>{{ t('topBar.switchLanguage') }}</span>
      </button>
    </div>

    <div class="auth-card-container">
      <!-- Left Branded Showcase Panel -->
      <div class="auth-showcase-panel">
        <div class="showcase-top">
          <router-link to="/" class="logo-link" :title="t('common.backToHome')">
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
          <h2 class="form-title">{{ t('auth.registerTitle') }}</h2>
          <p class="form-subtitle">{{ t('auth.registerSubtitle') }}</p>
        </div>

        <div v-if="formErrorMessage || authError" class="auth-error-banner" role="alert">
          {{ formErrorMessage || authError }}
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
          <!-- Full Name & Pharmacy Name in Two Columns -->
          <div class="form-row">
            <div class="field-group">
              <label for="reg-fullname" class="field-label">{{ t('auth.doctorName') }}</label>
              <div class="input-container">
                <User :size="18" class="input-icon" />
                <input
                  id="reg-fullname"
                  v-model="fullName"
                  type="text"
                  required
                  :placeholder="t('auth.fullNamePlaceholder')"
                  class="form-input"
                  autocomplete="name"
                />
              </div>
            </div>

            <div class="field-group">
              <label for="reg-bizname" class="field-label">{{ t('auth.pharmacyName') }}</label>
              <div class="input-container">
                <Building :size="18" class="input-icon" />
                <input
                  id="reg-bizname"
                  v-model="businessName"
                  type="text"
                  required
                  :placeholder="t('auth.pharmacyPlaceholder')"
                  class="form-input"
                />
              </div>
            </div>
          </div>

          <!-- Email & Phone Number -->
          <div class="form-row">
            <div class="field-group">
              <label for="reg-email" class="field-label">{{ t('auth.email') }}</label>
              <div class="input-container">
                <Mail :size="18" class="input-icon" />
                <input
                  id="reg-email"
                  v-model="email"
                  type="email"
                  required
                  :placeholder="t('auth.emailPlaceholder')"
                  class="form-input"
                  autocomplete="email"
                />
              </div>
            </div>

            <div class="field-group">
              <label for="reg-phone" class="field-label">{{ t('auth.phone') }}</label>
              <div class="input-container">
                <Phone :size="18" class="input-icon" />
                <input
                  id="reg-phone"
                  v-model="phoneNumber"
                  type="tel"
                  required
                  placeholder="01012345678"
                  class="form-input"
                  autocomplete="tel"
                />
              </div>
            </div>
          </div>

          <!-- Country & City -->
          <div class="form-row">
            <div class="field-group">
              <label for="reg-country" class="field-label">{{ t('auth.country') }}</label>
              <div class="select-container">
                <select
                  id="reg-country"
                  v-model="countryId"
                  required
                  class="form-input form-select"
                  @focus="loadCountries"
                  @click="loadCountries"
                  @change="onCountryChange"
                >
                  <option :value="null" disabled>
                    {{ isLoadingLocations ? t('auth.loadingLocations') : t('auth.selectCountry') }}
                  </option>
                  <option v-for="country in countries" :key="country.id" :value="country.id">
                    {{ country.name }}
                  </option>
                </select>
                <ChevronDown :size="16" class="select-chevron" />
              </div>
            </div>

            <div class="field-group">
              <label for="reg-city" class="field-label">{{ t('auth.city') }}</label>
              <div class="select-container">
                <select
                  id="reg-city"
                  v-model="cityId"
                  required
                  class="form-input form-select"
                  :disabled="!countryId"
                  @change="onCityChange"
                >
                  <option :value="null" disabled>{{ t('auth.selectCity') }}</option>
                  <option v-for="city in cities" :key="city.id" :value="city.id">
                    {{ city.name }}
                  </option>
                </select>
                <ChevronDown :size="16" class="select-chevron" />
              </div>
            </div>
          </div>

          <!-- Area & Street Address -->
          <div class="form-row">
            <div class="field-group">
              <label for="reg-area" class="field-label">{{ t('auth.area') }}</label>
              <div class="select-container">
                <select
                  id="reg-area"
                  v-model="areaId"
                  required
                  class="form-input form-select"
                  :disabled="!cityId"
                  @change="onAreaChange"
                >
                  <option :value="null" disabled>{{ t('auth.selectArea') }}</option>
                  <option v-for="area in areas" :key="area.id" :value="area.id">
                    {{ area.name }}
                  </option>
                </select>
                <ChevronDown :size="16" class="select-chevron" />
              </div>
            </div>

            <div class="field-group">
              <label for="reg-street" class="field-label">{{ t('auth.streetAddress') }}</label>
              <input
                id="reg-street"
                v-model="streetAddress"
                type="text"
                required
                :placeholder="t('auth.streetAddressPlaceholder')"
                class="form-input no-icon"
              />
            </div>
          </div>

          <!-- Password & Confirm Password -->
          <div class="form-row">
            <div class="field-group">
              <label for="reg-pass" class="field-label">{{ t('auth.password') }}</label>
              <div class="input-container">
                <Lock :size="18" class="input-icon" />
                <input
                  id="reg-pass"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :placeholder="t('auth.passwordPlaceholder')"
                  class="form-input"
                  autocomplete="new-password"
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

            <div class="field-group">
              <label for="reg-confirm-pass" class="field-label">{{ t('auth.confirmPassword') }}</label>
              <div class="input-container">
                <Lock :size="18" class="input-icon" />
                <input
                  id="reg-confirm-pass"
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :placeholder="t('auth.passwordPlaceholder')"
                  class="form-input"
                  autocomplete="new-password"
                />
              </div>
            </div>
          </div>

          <!-- Terms Agreement -->
          <div class="terms-checkbox">
            <label class="checkbox-label">
              <input v-model="agreeTerms" type="checkbox" required />
              <span>
                {{ t('auth.agreeTo') }}
                <router-link to="/terms" target="_blank" class="legal-link">
                  {{ t('footer.terms') }}
                </router-link>
                {{ t('auth.and') }}
                <router-link to="/privacy" target="_blank" class="legal-link">
                  {{ t('footer.privacy') }}
                </router-link>
              </span>
            </label>
          </div>

          <!-- Primary Submit Button -->
          <Button
            variant="cta"
            size="lg"
            block
            type="submit"
            :loading="isLoading"
            :disabled="!agreeTerms"
            class="submit-btn"
          >
            <span>{{ t('auth.submitRegister') }}</span>
            <ArrowRight :size="18" class="arrow-icon" />
          </Button>
        </form>

        <div class="auth-footer-prompt">
          <span>{{ t('auth.haveAccountPrompt') }}</span>
          <router-link to="/auth/login" class="login-link">
            {{ t('auth.signInLink') }}
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
  max-width: 1060px;
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

.auth-lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast, 0.2s);
}

.auth-card-container {
  width: 100%;
  max-width: 1060px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
}

@media (max-width: 860px) {
  .auth-card-container {
    grid-template-columns: 1fr;
  }
}

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
    display: none;
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

.auth-form-panel {
  padding: var(--space-2xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: var(--space-lg);
}

.form-title {
  font-size: 1.6rem;
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
  gap: var(--space-sm);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-deep-blue);
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
  height: 42px;
  padding: 0 36px 0 38px;
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

.form-input.no-icon {
  padding: 0 12px;
}

.select-container {
  position: relative;
  display: flex;
  align-items: center;
}

.form-select {
  appearance: none;
  padding: 0 36px 0 12px;
  cursor: pointer;
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-chevron {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

[dir="rtl"] .form-input.form-select {
  padding: 0 12px 0 36px;
}

[dir="rtl"] .form-input.no-icon {
  padding: 0 12px;
}

[dir="rtl"] .select-chevron {
  right: auto;
  left: 12px;
}

.toggle-eye {
  position: absolute;
  right: 12px;
  color: var(--color-text-tertiary);
  padding: 4px;
  cursor: pointer;
  background: none;
  border: none;
}

.terms-checkbox {
  margin: 6px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.legal-link {
  color: var(--color-primary-blue);
  font-weight: 600;
  text-decoration: underline;
}

.submit-btn {
  margin-top: 4px;
}

.auth-footer-prompt {
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

.login-link {
  font-weight: var(--font-weight-bold);
  color: var(--color-primary-blue);
  margin-left: 6px;
}

/* RTL Support */
[dir="rtl"] .input-icon {
  left: auto;
  right: 14px;
}

[dir="rtl"] .form-input {
  padding: 0 38px 0 36px;
}

[dir="rtl"] .toggle-eye {
  right: auto;
  left: 12px;
}

[dir="rtl"] .login-link {
  margin-left: 0;
  margin-right: 6px;
}
</style>
