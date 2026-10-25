<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  User,
  Building2,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Lock,
  FileText,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Save,
  ArrowRight,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';
import { useToast } from '@/composables/useToast';
import { authService } from '@/services/auth.service';
import { getPlaceholder, onImageError } from '@/utils/placeholders';
import Button from '@/components/ui/Button.vue';

const router = useRouter();
const toast = useToast();
const { t, locale } = useI18n();
const { user, updateProfile, fetchUserProfile } = useAuth();

const isLoadingProfile = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);

const isChangingPassword = ref(false);
const isSubmittingPassword = ref(false);

const formFullName = ref('');
const formBusinessName = ref('');
const formEmail = ref('');
const formPhone = ref('');

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');

function syncFormData() {
  formFullName.value = user.value?.fullName || '';
  formBusinessName.value = user.value?.businessName || '';
  formEmail.value = user.value?.email || '';
  formPhone.value = user.value?.phoneNumber || '';
}

onMounted(async () => {
  isLoadingProfile.value = true;
  try {
    await fetchUserProfile();
  } catch (err) {
    console.warn('[ProfileView] Failed to refresh profile:', err);
  } finally {
    isLoadingProfile.value = false;
    syncFormData();
  }
});

async function handleSaveProfile() {
  isSaving.value = true;
  try {
    await updateProfile({
      fullName: formFullName.value.trim(),
      businessName: formBusinessName.value.trim(),
      phoneNumber: formPhone.value.trim()
    });
    isEditing.value = false;
    syncFormData();
    toast.success(t('profile.updateSuccess'));
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      t('profile.updateFailed');
    toast.error(msg);
  } finally {
    isSaving.value = false;
  }
}

function cancelEdit() {
  syncFormData();
  isEditing.value = false;
}

async function handlePasswordChange() {
  passwordError.value = '';
  if (!currentPassword.value || !newPassword.value) {
    passwordError.value = t('profile.fillAllPasswordFields');
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value = t('profile.passwordMinLength');
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = t('profile.passwordMismatch');
    return;
  }

  isSubmittingPassword.value = true;
  try {
    await authService.changePassword(currentPassword.value, newPassword.value);
    toast.success(t('profile.passwordChangeSuccess'));
    isChangingPassword.value = false;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err: any) {
    const msg =
      err.response?.data?.message ||
      err.message ||
      t('profile.passwordChangeFailed');
    passwordError.value = msg;
    toast.error(msg);
  } finally {
    isSubmittingPassword.value = false;
  }
}

// Helpers for clean placeholder management
function valOrPlaceholder(val: any, fallback?: string): string {
  if (
    val !== null &&
    val !== undefined &&
    String(val).trim() !== '' &&
    String(val).trim().toLowerCase() !== 'null' &&
    String(val).trim().toLowerCase() !== 'undefined'
  ) {
    return String(val).trim();
  }
  return fallback || t('profile.notSpecified');
}

function isBlank(val: any): boolean {
  return (
    val === null ||
    val === undefined ||
    String(val).trim() === '' ||
    String(val).trim().toLowerCase() === 'null' ||
    String(val).trim().toLowerCase() === 'undefined'
  );
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale.value === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

const displayName = computed(() => {
  if (!user.value) return t('profile.licensedPharmacist');
  const full = user.value.fullName?.trim();
  const userN = user.value.userName?.trim();
  const bus = user.value.businessName?.trim();
  return full || userN || bus || t('profile.licensedPharmacist');
});

const avatarInitial = computed(() => {
  const name = displayName.value || user.value?.businessName || 'P';
  return name.trim().charAt(0).toUpperCase() || 'P';
});

</script>

<template>
  <div class="profile-page">
    <div class="drugza-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb-row">
        <router-link to="/">{{ t('nav.home') }}</router-link>
        <ChevronRight :size="14" class="arrow-icon" />
        <span class="current">{{ t('profile.title') }}</span>
      </nav>

      <!-- Profile Header Hero Card -->
      <div class="profile-hero-card">
        <div class="profile-avatar-wrap">
          <img
            v-if="user?.profileImage"
            :src="user.profileImage"
            :alt="displayName"
            class="profile-img"
            @error="onImageError($event, 'user')"
          />
          <div v-else class="avatar-fallback">
            <img :src="getPlaceholder('user')" :alt="displayName" class="profile-img" />
          </div>
        </div>

        <div class="profile-hero-info">
          <div class="name-status-row">
            <h1 class="user-display-name">{{ displayName }}</h1>
            <span class="eda-verified-pill" :class="{ 'is-inactive': !user?.isActive }">
              <ShieldCheck :size="15" />
              <span>
                {{
                  user?.isActive
                    ? t('profile.activeVerifiedAccount')
                    : t('profile.pendingActivation')
                }}
              </span>
            </span>
          </div>

          <p class="pharmacy-org-title">
            <Building2 :size="16" />
            <span :class="{ 'is-placeholder-text': isBlank(user?.businessName) }">
              {{ valOrPlaceholder(user?.businessName, t('profile.facilityNotProvided')) }}
            </span>
          </p>

          <div class="contact-badges">
            <span class="contact-badge" :class="{ 'is-empty': isBlank(user?.email) }">
              <Mail :size="14" />
              <span>{{ valOrPlaceholder(user?.email, t('profile.noEmail')) }}</span>
            </span>
            <span class="contact-badge" :class="{ 'is-empty': isBlank(user?.phoneNumber) }">
              <Phone :size="14" />
              <span dir="ltr">{{ valOrPlaceholder(user?.phoneNumber, t('profile.noPhone')) }}</span>
            </span>
          </div>
        </div>

        <div class="profile-hero-actions">
          <Button
            v-if="!isEditing"
            variant="secondary"
            size="md"
            @click="isEditing = true"
          >
            <span>{{ t('profile.editProfile') }}</span>
          </Button>
          <div v-else class="hero-edit-actions">
            <Button
              variant="ghost"
              size="sm"
              :disabled="isSaving"
              @click="cancelEdit"
            >
              <span>{{ t('common.cancel') }}</span>
            </Button>
            <Button
              variant="cta"
              size="md"
              :loading="isSaving"
              @click="handleSaveProfile"
            >
              <Save :size="16" />
              <span>{{ isSaving ? t('profile.saving') : t('profile.saveChanges') }}</span>
            </Button>
          </div>
        </div>
      </div>

      <div class="profile-grid-layout" v-loading="isLoadingProfile || isSaving">
        <!-- Col 1: Real Profile Information from API -->
        <div class="profile-main-col">
          <!-- Main Profile Details Card (Fully Bound to API fields with Placeholders) -->
          <div class="profile-section-card">
            <div class="card-header-bar">
              <div class="card-title-group">
                <FileText :size="20" class="card-ico" />
                <div>
                  <h2 class="card-title">
                    {{ t('profile.accountDetails') }}
                  </h2>
                  <p class="card-sub">
                    {{ t('profile.officialDataNotice') }}
                  </p>
                </div>
              </div>
              <span class="active-tag" :class="{ 'inactive-tag': !user?.isActive }">
                <CheckCircle2 :size="14" />
                {{
                  user?.isActive
                    ? t('profile.activeVerified')
                    : t('profile.pendingActivation')
                }}
              </span>
            </div>

            <!-- View Mode: Displays all API fields with placeholders for null values -->
            <div v-if="!isEditing" class="details-view-grid">
              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.fullName') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': isBlank(user?.fullName) }">
                  {{ valOrPlaceholder(user?.fullName, t('profile.notProvided')) }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.businessName') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': isBlank(user?.businessName) }">
                  {{ valOrPlaceholder(user?.businessName, t('profile.notProvided')) }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.username') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': isBlank(user?.userName) }">
                  {{ valOrPlaceholder(user?.userName, t('profile.notSet')) }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.email') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': isBlank(user?.email) }">
                  {{ valOrPlaceholder(user?.email, t('profile.notProvided')) }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.phone') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': isBlank(user?.phoneNumber) }" dir="ltr">
                  {{ valOrPlaceholder(user?.phoneNumber, t('profile.notProvided')) }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.accountRole') }}</span>
                <span class="detail-val role-tag">
                  {{
                    user?.role
                      ? (user.role === 'Pharmacy' || user.role.toLowerCase() === 'pharmacy'
                          ? t('profile.communityPharmacy')
                          : user.role)
                      : t('profile.communityPharmacy')
                  }}
                </span>
              </div>


              <div v-if="user?.minOrder" class="detail-tile">
                <span class="detail-key">{{ t('profile.minOrder') }}</span>
                <span class="detail-val font-semibold">
                  {{ user.minOrder }} {{ t('common.currency') }}
                </span>
              </div>

              <div class="detail-tile">
                <span class="detail-key">{{ t('profile.memberSince') }}</span>
                <span class="detail-val" :class="{ 'is-placeholder-val': !formatDate(user?.createdAt) }">
                  {{ formatDate(user?.createdAt) || t('profile.notSpecified') }}
                </span>
              </div>
            </div>

            <!-- Edit Form Mode -->
            <form v-else @submit.prevent="handleSaveProfile" class="edit-form-grid">

              <div class="form-group">
                <label>{{ t('profile.fullName') }} *</label>
                <input
                  v-model="formFullName"
                  type="text"
                  class="input-field"
                  :placeholder="t('profile.pharmacistNamePlaceholder')"
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ t('profile.businessName') }} *</label>
                <input
                  v-model="formBusinessName"
                  type="text"
                  class="input-field"
                  :placeholder="t('profile.pharmacyNamePlaceholder')"
                  required
                />
              </div>

              <div class="form-group">
                <label>{{ t('profile.email') }} ({{ t('profile.readOnly') }})</label>
                <input
                  v-model="formEmail"
                  type="email"
                  class="input-field is-readonly"
                  disabled
                  :title="t('profile.emailModNotice')"
                />
              </div>

              <div class="form-group">
                <label>{{ t('profile.phone') }} *</label>
                <input
                  v-model="formPhone"
                  type="text"
                  class="input-field"
                  dir="ltr"
                  :placeholder="locale === 'ar' ? '01xxxxxxxxx' : '+20 1xxxxxxxxx'"
                  required
                />
              </div>

              <div class="form-actions-bar full-width">
                <Button variant="ghost" size="sm" type="button" :disabled="isSaving" @click="cancelEdit">
                  {{ t('common.cancel') }}
                </Button>
                <Button variant="primary" size="sm" type="submit" :loading="isSaving">
                  {{ isSaving ? t('profile.saving') : t('common.save') }}
                </Button>
              </div>
            </form>
          </div>

          <!-- Security & Password -->
          <div class="profile-section-card">
            <div class="card-header-bar">
              <div class="card-title-group">
                <Lock :size="20" class="card-ico" />
                <div>
                  <h2 class="card-title">{{ t('profile.securityCardTitle') }}</h2>
                  <p class="card-sub">{{ t('profile.securityCardSub') }}</p>
                </div>
              </div>
              <Button
                v-if="!isChangingPassword"
                variant="outline"
                size="sm"
                @click="isChangingPassword = true"
              >
                <KeyRound :size="15" />
                <span>{{ t('profile.changePassword') }}</span>
              </Button>
            </div>

            <div v-if="isChangingPassword" class="password-form-box">
              <div v-if="passwordError" class="pass-err-msg">{{ passwordError }}</div>
              <div class="password-inputs-row">
                <div class="form-group">
                  <label>{{ t('profile.currentPasswordLabel') }} *</label>
                  <input v-model="currentPassword" type="password" class="input-field" autocomplete="current-password" />
                </div>
                <div class="form-group">
                  <label>{{ t('auth.newPass') }} *</label>
                  <input v-model="newPassword" type="password" class="input-field" autocomplete="new-password" />
                </div>
                <div class="form-group">
                  <label>{{ t('auth.confirmNewPass') }} *</label>
                  <input v-model="confirmPassword" type="password" class="input-field" autocomplete="new-password" />
                </div>
              </div>
              <div class="pass-actions">
                <Button variant="ghost" size="sm" :disabled="isSubmittingPassword" @click="isChangingPassword = false">
                  {{ t('common.cancel') }}
                </Button>
                <Button variant="primary" size="sm" :loading="isSubmittingPassword" @click="handlePasswordChange">
                  {{ isSubmittingPassword ? t('profile.updatingPassword') : t('profile.updatePasswordBtn') }}
                </Button>
              </div>
            </div>
            <p v-else class="security-safe-text">
              {{ t('profile.securityNotice') }}
            </p>
          </div>
        </div>

        <!-- Col 2: Quick Links Sidebar -->
        <div class="profile-sidebar-col">
          <div class="nav-card">
            <h3 class="nav-card-title">{{ t('profile.quickLinksTitle') }}</h3>
            <div class="nav-links-list">
              <router-link to="/addresses" class="nav-link-btn">
                <div class="link-label-box">
                  <MapPin :size="18" class="link-ico" />
                  <div>
                    <strong>{{ t('nav.addresses') }}</strong>
                    <span>{{ t('profile.branchesTitle') }}</span>
                  </div>
                </div>
                <ChevronRight :size="16" class="arrow-icon" />
              </router-link>

              <router-link to="/orders" class="nav-link-btn">
                <div class="link-label-box">
                  <FileText :size="18" class="link-ico" />
                  <div>
                    <strong>{{ t('nav.orders') }}</strong>
                    <span>{{ t('profile.ordersTrackTitle') }}</span>
                  </div>
                </div>
                <ChevronRight :size="16" class="arrow-icon" />
              </router-link>

              <router-link to="/favorites" class="nav-link-btn">
                <div class="link-label-box">
                  <ShieldCheck :size="18" class="link-ico" />
                  <div>
                    <strong>{{ t('nav.favorites') }}</strong>
                    <span>{{ t('profile.reorderTitle') }}</span>
                  </div>
                </div>
                <ChevronRight :size="16" class="arrow-icon" />
              </router-link>
            </div>
          </div>

          <!-- Help Desk Card -->
          <div class="support-card">
            <div class="support-badge">{{ t('profile.careTitle') }}</div>
            <h4 class="support-title">{{ t('profile.needHelpTitle') }}</h4>
            <p class="support-sub">
              {{ t('profile.careDesc') }}
            </p>
            <a href="mailto:support@drugza.com" class="support-contact-btn">
              <span>{{ t('profile.contactSupportBtn') }}</span>
              <ArrowRight :size="16" class="arrow-icon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: var(--space-xl) 0 var(--space-3xl);
  background-color: var(--color-off-white);
  min-height: calc(100vh - 120px);
}

.breadcrumb-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-lg);
}

.breadcrumb-row a {
  color: var(--color-text-secondary);
  text-decoration: none;
}
.breadcrumb-row a:hover {
  color: var(--color-primary-blue);
}
.breadcrumb-row .current {
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
}

/* Profile Hero Card */
.profile-hero-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  margin-bottom: var(--space-2xl);
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .profile-hero-card {
    padding: var(--space-lg);
    border-radius: var(--radius-xl);
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }
}

.profile-avatar-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--color-primary-blue-light);
  border: 3px solid var(--color-border-light);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-hero-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-grow: 1;
  min-width: 250px;
}

.name-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-display-name {
  font-size: 1.625rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  line-height: 1.25;
}

@media (max-width: 640px) {
  .user-display-name {
    font-size: 1.3rem;
  }
}

.eda-verified-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-success-bg);
  color: var(--color-success);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
}

.eda-verified-pill.is-inactive {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

.pharmacy-org-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.contact-badges {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: 4px;
  flex-wrap: wrap;
}

.contact-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background: var(--color-off-white);
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  border: 1px solid var(--color-border-light);
}

.contact-badge.is-empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.profile-hero-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.hero-edit-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* Grid Layout */
.profile-grid-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-xl);
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .profile-grid-layout {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
}

.profile-main-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.profile-section-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-xs);
}

@media (max-width: 640px) {
  .profile-section-card {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }
}

.card-header-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.card-title-group {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
}

.card-ico {
  color: var(--color-primary-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.card-title {
  font-size: 1.125rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
}

.card-sub {
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.active-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 0.75rem;
  font-weight: var(--font-weight-semibold);
  padding: 3px 10px;
  border-radius: var(--radius-pill);
}

.active-tag.inactive-tag {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

/* Details Grid: 2 columns of clean structured field tiles */
.details-view-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 640px) {
  .details-view-grid {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
}

.detail-tile {
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.full-width-tile {
  grid-column: 1 / -1;
}

.detail-key {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.detail-val {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-semibold);
  word-break: break-word;
}

.role-tag {
  display: inline-block;
  color: var(--color-primary-blue);
}

/* Placeholder styling */
.is-placeholder-val {
  color: var(--color-text-tertiary) !important;
  font-style: italic;
  font-weight: normal !important;
}

.is-placeholder-text {
  color: var(--color-text-tertiary) !important;
  font-style: italic;
}

/* Edit Form */
.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

@media (max-width: 640px) {
  .edit-form-grid {
    grid-template-columns: 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.78125rem;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.input-field {
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  background: var(--color-off-white);
  outline: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.input-field:focus {
  border-color: var(--color-primary-blue);
  background: #FFFFFF;
}

.input-field.is-readonly {
  background: #EAECEF;
  cursor: not-allowed;
  color: var(--color-text-secondary);
}

/* Avatar Upload inside Edit Form */
.avatar-upload-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  background: var(--color-off-white);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.preview-avatar-box {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--color-primary-blue-light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1.5px solid var(--color-border);
  flex-shrink: 0;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-initial {
  font-weight: var(--font-weight-bold);
  font-size: 1.3rem;
  color: var(--color-primary-blue);
}

.upload-btn-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.custom-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  color: var(--color-deep-blue);
  width: fit-content;
  transition: background var(--dur-fast);
}

.custom-file-btn:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-primary-blue);
}

.hidden-file-input {
  display: none;
}

.upload-hint {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.form-actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

/* Security */
.security-safe-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.password-inputs-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}

@media (max-width: 768px) {
  .password-inputs-row {
    grid-template-columns: 1fr;
  }
}

.pass-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}

.pass-err-msg {
  color: var(--color-error);
  font-size: 0.8125rem;
  margin-bottom: var(--space-sm);
}

/* Sidebar */
.nav-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-xs);
}

.nav-card-title {
  font-size: 1.0625rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  margin-bottom: var(--space-md);
}

.nav-links-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.nav-link-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  text-decoration: none;
  color: var(--color-text-secondary);
  transition: all var(--dur-fast) var(--ease-smooth);
}

.nav-link-btn:hover {
  background: var(--color-pale-blue);
  border-color: var(--color-primary-blue);
  color: var(--color-deep-blue);
}

.link-label-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-label-box strong {
  display: block;
  font-size: 0.875rem;
  color: var(--color-deep-blue);
}

.link-label-box span {
  display: block;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
}

.link-ico {
  color: var(--color-primary-blue);
}

.support-card {
  background: linear-gradient(135deg, #12496B 0%, #1976AD 100%);
  color: #FFFFFF;
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.support-badge {
  font-size: 0.6875rem;
  color: var(--color-accent-yellow);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.support-title {
  font-size: 1.125rem;
  font-weight: var(--font-weight-bold);
  margin-bottom: 6px;
}

.support-sub {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.45;
  margin-bottom: var(--space-md);
}

.support-contact-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-accent-yellow);
  color: var(--color-deep-blue);
  padding: 10px 16px;
  border-radius: var(--radius-pill);
  font-size: 0.8125rem;
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition: transform var(--dur-fast);
}

.support-contact-btn:hover {
  transform: translateY(-1px);
}
</style>
