<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  FileText,
  Scale,
  ShieldCheck,
  Lock,
  CheckCircle2,
  RefreshCw,
  Building2,
  Search,
  LogIn,
  UserPlus,
  AlertCircle,
  Globe
} from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import { policyService } from '@/services/policy.service';
import { useI18n } from '@/composables/useI18n';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';

interface TermItem {
  number?: string;
  label?: string;
  text: string;
}

interface TermSection {
  id: string;
  number: number;
  badge: string;
  ordinal?: string;
  title: string;
  intro: string;
  items: TermItem[];
  paragraphs: string[];
}

const route = useRoute();
const { t, locale, toggleLocale } = useI18n();

const isMinimal = computed(() => {
  return route.path.startsWith('/auth') || route.query.minimal === 'true' || route.meta.hideNav === true;
});

const content = ref<string>('');
const isLoading = ref<boolean>(true);
const isUnauthorized = ref<boolean>(false);
const error = ref<string | null>(null);
const searchQuery = ref<string>('');

async function loadTerms() {
  isLoading.value = true;
  isUnauthorized.value = false;
  error.value = null;
  try {
    const langCode = locale.value === 'ar' ? 1 : 2;
    // Live call to GET /api/TermsAndConditions/get-terms?lang=1 or 2
    const res = await policyService.getTerms(langCode);
    if (!res || !res.trim()) {
      throw new Error('Empty response');
    }
    content.value = res;
  } catch (err: any) {
    console.error('[TermsView] Error fetching terms:', err);
    if (err.response?.status === 401) {
      isUnauthorized.value = true;
    } else {
      error.value = t('terms.fetchErrorDesc');
    }
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTerms();
});

watch(locale, () => {
  loadTerms();
});

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const AR_TERMS_ORDINALS = [
  'أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً', 'سادساً', 'سابعاً', 'ثامناً', 'تاسعاً', 'عاشراً',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر', 'السادس عشر', 'السابع عشر',
  'الثامن عشر', 'التاسع عشر', 'العشرون', 'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون',
  'الرابع والعشرون', 'الخامس والعشرون', 'السادس والعشرون', 'السابع والعشرون', 'الإقرار والموافقة'
];

/**
 * Dynamically parse raw API string into structured sections strictly ordered 1 to 28
 * matching both Arabic and English exactly.
 */
const parsedSections = computed<TermSection[]>(() => {
  if (!content.value) return [];
  const lines = content.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const sections: TermSection[] = [];
  let currentSection: TermSection | null = null;
  let nextExpectedNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip preamble/title lines at start
    if (sections.length === 0 && !currentSection) {
      if (
        line.includes('الشروط والأحكام') ||
        line.toLowerCase().includes('terms and conditions') ||
        line.includes('منصة DrugZA') ||
        line.includes('آخر تحديث') ||
        line.includes('يرجى قراءة') ||
        line.startsWith('Part ')
      ) {
        continue;
      }
    }

    // Skip Part headers (Part One, Part Two, etc.)
    if (/^Part\s+[A-Za-z]+:/i.test(line)) {
      continue;
    }

    let isSectionHeading = false;
    let badgeNum = nextExpectedNum;
    let sectionTitle = line;

    if (locale.value === 'ar') {
      for (let oIdx = AR_TERMS_ORDINALS.length - 1; oIdx >= 0; oIdx--) {
        const ord = AR_TERMS_ORDINALS[oIdx];
        if (line.startsWith(ord)) {
          isSectionHeading = true;
          badgeNum = oIdx + 1;
          if (line.includes(':')) {
            sectionTitle = line.split(':').slice(1).join(':').trim();
          } else {
            sectionTitle = line.replace(ord, '').trim();
          }
          if (!sectionTitle) sectionTitle = ord;
          break;
        }
      }
    } else {
      const numMatch = /^(\d+)\.\s+(.*)/.exec(line);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        const title = numMatch[2].trim();
        const hasTab = line.includes('\t');
        const endsWithPeriod = title.endsWith('.');

        // An English section header: matches expected sequence, has no tab, and doesn't end with a period
        if (num === nextExpectedNum && !hasTab && (!endsWithPeriod || title.length < 50)) {
          isSectionHeading = true;
          badgeNum = num;
          sectionTitle = title;
        }
      } else if (/^Acknowledgment and Consent/i.test(line)) {
        isSectionHeading = true;
        badgeNum = 28;
        sectionTitle = line;
      }
    }

    if (isSectionHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      nextExpectedNum = badgeNum + 1;
      const id = `term-sec-${badgeNum}`;
      const ordinal = locale.value === 'ar' ? AR_TERMS_ORDINALS[badgeNum - 1] : `${badgeNum}`;
      const badge = locale.value === 'ar'
        ? `${badgeNum < 10 ? '0' + badgeNum : badgeNum} • ${ordinal}`
        : `${badgeNum < 10 ? '0' + badgeNum : badgeNum}`;

      currentSection = {
        id,
        number: badgeNum,
        badge,
        ordinal,
        title: sectionTitle,
        intro: '',
        items: [],
        paragraphs: []
      };
    } else if (currentSection) {
      const isNumItem = /^(\d+)\.\s*(.*)/.exec(line);
      const isBullet = /^[•\-\*o]\s*(.*)/.exec(line);
      const colonIdx = line.indexOf(':');

      if (isNumItem) {
        const num = isNumItem[1];
        const rest = isNumItem[2].trim();
        if (rest.includes(':')) {
          const cIdx = rest.indexOf(':');
          currentSection.items.push({
            number: num,
            label: rest.substring(0, cIdx).trim(),
            text: rest.substring(cIdx + 1).trim()
          });
        } else {
          currentSection.items.push({ number: num, text: rest });
        }
      } else if (isBullet) {
        const rest = isBullet[1].trim();
        if (rest.includes(':')) {
          const cIdx = rest.indexOf(':');
          currentSection.items.push({
            label: rest.substring(0, cIdx).trim(),
            text: rest.substring(cIdx + 1).trim()
          });
        } else {
          currentSection.items.push({ text: rest });
        }
      } else if (
        colonIdx > 0 &&
        colonIdx < 35 &&
        !line.startsWith('http') &&
        (currentSection.items.length > 0 || currentSection.title.includes('التعريف') || currentSection.title.includes('Definitions'))
      ) {
        // Definitions or key-value items
        currentSection.items.push({
          label: line.substring(0, colonIdx).trim(),
          text: line.substring(colonIdx + 1).trim()
        });
      } else {
        if (!currentSection.intro) {
          currentSection.intro = line;
        } else {
          currentSection.paragraphs.push(line);
        }
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
});

/**
 * Filter sections based on real-time search query.
 */
const filteredSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return parsedSections.value;

  return parsedSections.value.filter(sec => {
    if (sec.title.toLowerCase().includes(q)) return true;
    if (sec.intro.toLowerCase().includes(q)) return true;
    if (sec.paragraphs.some(p => p.toLowerCase().includes(q))) return true;
    if (sec.items.some(it => (it.label || '').toLowerCase().includes(q) || it.text.toLowerCase().includes(q))) return true;
    return false;
  });
});
</script>

<template>
  <div class="terms-page">
    <div class="drugza-container terms-container">
      <!-- Minimal Auth Top Bar (when opened from register/auth) -->
      <div v-if="isMinimal" class="minimal-top-bar">
        <DrugzaLogo size="md" />
        <div class="minimal-top-actions">
          <button type="button" class="minimal-lang-btn" @click="toggleLocale">
            <Globe :size="16" />
            <span>{{ t('topBar.switchLanguage') }}</span>
          </button>
          <router-link to="/auth/register" class="minimal-close-btn">
            <span>{{ t('terms.backToRegister') }}</span>
          </router-link>
        </div>
      </div>

      <!-- Standard Breadcrumb (only when full layout) -->
      <nav v-else class="terms-breadcrumb" aria-label="Breadcrumb">
        <router-link to="/">{{ t('common.home') }}</router-link>
        <span class="sep">/</span>
        <span class="current">{{ t('terms.pageTitle') }}</span>
      </nav>

      <!-- Hero Header Card -->
      <header class="terms-hero-card">
        <div class="hero-top-row">
          <div class="hero-icon-badge">
            <Scale :size="32" class="scale-icon" />
          </div>

          <div class="hero-text-block">
            <div class="compliance-pill">
              <FileText :size="13" />
              <span>{{ t('terms.officialNotice') }}</span>
            </div>

            <h1 class="hero-title">
              {{ t('terms.pageTitle') }}
            </h1>

            <p class="hero-desc">
              {{ t('terms.pageSubtitle') }}
            </p>
          </div>
        </div>

        <!-- 3 Pillars Grid -->
        <div class="pillars-row">
          <div class="pillar-item">
            <div class="pillar-icon-box blue">
              <Building2 :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ t('terms.intermediaryBadge') }}</strong>
              <p>{{ t('terms.intermediaryDesc') }}</p>
            </div>
          </div>

          <div class="pillar-item">
            <div class="pillar-icon-box green">
              <ShieldCheck :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ t('terms.licenseBadge') }}</strong>
              <p>{{ t('terms.licenseDesc') }}</p>
            </div>
          </div>

          <div class="pillar-item">
            <div class="pillar-icon-box orange">
              <Lock :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ t('terms.legalBadge') }}</strong>
              <p>{{ t('terms.legalDesc') }}</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="terms-main-content">
        <!-- Loading State Skeleton -->
        <div v-if="isLoading" class="state-card loading-card" style="display: flex; flex-direction: column; gap: 18px; padding: 32px;">
          <div class="spinner-line" style="display: flex; align-items: center; gap: 10px; color: var(--color-primary-blue); font-weight: 600;">
            <RefreshCw :size="20" class="spin-animation" />
            <span>{{ t('terms.loadingDoc') }}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
            <Skeleton width="45%" height="24px" radius="6px" />
            <Skeleton width="100%" height="15px" radius="4px" />
            <Skeleton width="96%" height="15px" radius="4px" />
            <Skeleton width="90%" height="15px" radius="4px" />
            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 8px; display: flex; flex-direction: column; gap: 10px;">
              <Skeleton width="50%" height="22px" radius="6px" />
              <Skeleton width="100%" height="15px" radius="4px" />
              <Skeleton width="92%" height="15px" radius="4px" />
            </div>
          </div>
        </div>

        <!-- Unauthorized State (401 from Backend) -->
        <div v-else-if="isUnauthorized" class="state-card auth-needed-card">
          <div class="auth-icon-circle">
            <Lock :size="38" />
          </div>
          <h3 class="auth-card-title">
            {{ t('terms.authRequiredTitle') }}
          </h3>
          <p class="auth-card-desc">
            {{ t('terms.authRequiredDesc') }}
          </p>
          <div class="auth-action-buttons">
            <router-link to="/auth/login?redirect=/terms" class="auth-btn primary">
              <LogIn :size="16" />
              <span>{{ t('terms.loginBtn') }}</span>
            </router-link>
            <router-link to="/auth/register" class="auth-btn secondary">
              <UserPlus :size="16" />
              <span>{{ t('terms.registerBtn') }}</span>
            </router-link>
          </div>
        </div>

        <!-- General Error State -->
        <div v-else-if="error" class="state-card error-card">
          <AlertCircle :size="42" class="error-alert-icon" />
          <h3 class="error-heading">{{ t('terms.dataErrorTitle') }}</h3>
          <p class="error-message">{{ error }}</p>
          <Button variant="primary" size="md" @click="loadTerms">
            <RefreshCw :size="16" />
            <span>{{ t('terms.retryBtn') }}</span>
          </Button>
        </div>

        <!-- Live Content Display -->
        <div v-else class="terms-card-shell">
          <!-- Control Bar with Search -->
          <div class="terms-control-bar">
            <!-- Search Inside Terms Input -->
            <div class="terms-search-wrap">
              <Search :size="16" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('terms.searchPlaceholder')"
                class="terms-search-input"
              />
              <button
                v-if="searchQuery"
                type="button"
                @click="searchQuery = ''"
                class="search-clear-btn"
                aria-label="Clear search"
              >
                &times;
              </button>
            </div>
          </div>

          <!-- Quick Jump Pills -->
          <div v-if="parsedSections.length > 0" class="jump-pills-row">
            <span class="jump-label">{{ t('terms.jumpToClause') }}</span>
            <div class="jump-pills-scroll">
              <button
                v-for="sec in parsedSections"
                :key="sec.id"
                type="button"
                class="jump-pill-btn"
                @click="scrollToSection(sec.id)"
              >
                {{ sec.ordinal ? (locale === 'ar' ? sec.ordinal : t('terms.clauseLabel', { number: sec.number })) : sec.badge }}
              </button>
            </div>
          </div>

          <!-- Legal Enforceability Notice -->
          <div class="legal-callout">
            <CheckCircle2 :size="20" class="callout-icon" />
            <div>
              <strong class="callout-title">
                {{ t('terms.bindingNotice') }}
              </strong>
              <p class="callout-desc">
                {{ t('terms.bindingDesc') }}
              </p>
            </div>
          </div>

          <!-- Search Results Counter if filtering -->
          <div v-if="searchQuery" class="search-results-info">
            {{ t('terms.foundSections', { count: filteredSections.length, query: searchQuery }) }}
          </div>

          <!-- Rich Styled Sections Stream -->
          <div class="sections-stream">
            <div v-if="filteredSections.length === 0" class="empty-search-state">
              <Search :size="36" />
              <p>{{ t('terms.noMatches') }}</p>
            </div>

            <article
              v-for="sec in filteredSections"
              :key="sec.id"
              :id="sec.id"
              class="terms-section-card"
            >
              <!-- Section Top Header -->
              <div class="section-top-bar">
                <div class="section-icon-bubble">
                  <FileText :size="20" />
                </div>
                <div class="section-title-area">
                  <span class="section-badge-tag">{{ sec.badge }}</span>
                  <h2 class="section-heading">{{ sec.title }}</h2>
                </div>
              </div>

              <!-- Section Intro Text -->
              <p v-if="sec.intro" class="section-intro-paragraph">
                {{ sec.intro }}
              </p>

              <!-- Section Items Grid -->
              <div v-if="sec.items.length > 0" class="section-items-grid">
                <div
                  v-for="(item, iIdx) in sec.items"
                  :key="iIdx"
                  class="styled-item-card"
                >
                  <div class="item-marker">
                    <span v-if="item.number" class="marker-number">{{ item.number }}</span>
                    <span v-else class="marker-dot">&bull;</span>
                  </div>

                  <div class="item-content-body">
                    <strong v-if="item.label" class="item-bold-label">{{ item.label }}: </strong>
                    <span class="item-text-body">{{ item.text }}</span>
                  </div>
                </div>
              </div>

              <!-- Section Extra Paragraphs -->
              <p
                v-for="(para, pIdx) in sec.paragraphs"
                :key="pIdx"
                class="section-extra-paragraph"
              >
                {{ para }}
              </p>
            </article>
          </div>

          <!-- Bottom Compliance & Support Box -->
          <section class="compliance-contact-banner">
            <div class="banner-icon">
              <Building2 :size="26" />
            </div>
            <div class="banner-text">
              <h4 class="banner-title">{{ t('terms.legalHelpTitle') }}</h4>
              <p class="banner-desc">
                {{ t('terms.legalHelpDesc') }}
                <a href="mailto:support@drugza.com" class="banner-email-link">support@drugza.com</a>
              </p>
            </div>
            <a href="mailto:support@drugza.com" class="banner-cta-btn">
              {{ t('terms.contactLegalBtn') }}
            </a>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.terms-page {
  padding: var(--space-2xl) 0 var(--space-4xl);
  background: var(--color-off-white);
  min-height: calc(100vh - 200px);
}

.terms-container {
  max-width: 980px;
  margin: 0 auto;
}

/* Minimal Auth Top Bar */
.minimal-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  margin-bottom: var(--space-xl);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  flex-wrap: wrap;
  gap: 12px;
}

.minimal-top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.minimal-lang-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  color: var(--color-deep-blue);
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.15s ease;
}

.minimal-lang-btn:hover {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
  color: var(--color-primary-blue);
}

.minimal-close-btn {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  border: 1px solid rgba(25, 118, 173, 0.25);
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: var(--radius-pill);
  text-decoration: none;
  transition: all 0.15s ease;
}

.minimal-close-btn:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

/* Breadcrumb */
.terms-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-lg);
}

.terms-breadcrumb a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.terms-breadcrumb a:hover {
  color: var(--color-primary-blue);
}

.terms-breadcrumb .sep {
  color: var(--color-border);
}

.terms-breadcrumb .current {
  color: var(--color-primary-blue);
  font-weight: 500;
}

/* Hero Header Card */
.terms-hero-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: var(--space-xl);
}

.hero-top-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.hero-icon-badge {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--color-pale-blue), #E0F2FE);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(25, 118, 173, 0.18);
}

.hero-text-block {
  flex: 1 1 340px;
}

.compliance-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary-blue);
  background: var(--color-pale-blue);
  border: 1px solid rgba(25, 118, 173, 0.25);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  margin-bottom: 6px;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-deep-blue);
  margin: 6px 0 8px;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.hero-desc {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin: 0;
}

/* 3 Pillars Row */
.pillars-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 820px) {
  .pillars-row {
    grid-template-columns: 1fr;
  }
}

.pillar-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.pillar-icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pillar-icon-box.blue { background: var(--color-pale-blue); color: var(--color-primary-blue); }
.pillar-icon-box.green { background: #ECFDF5; color: #059669; }
.pillar-icon-box.orange { background: #FFFBEB; color: #D97706; }

.pillar-text strong {
  display: block;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin-bottom: 2px;
}

.pillar-text p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* Card Shell */
.terms-card-shell {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

/* Control Bar */
.terms-control-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-lg);
}

.terms-search-wrap {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-start: 14px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.terms-search-input {
  width: 100%;
  padding: 10px 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background: var(--color-off-white);
  transition: all 0.2s ease;
}

.terms-search-input:focus {
  outline: none;
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: 0 0 0 3px rgba(25, 118, 173, 0.12);
}

.search-clear-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  inset-inline-end: 14px;
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

/* Jump Pills Row */
.jump-pills-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--space-xl);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-off-white);
}

.jump-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  font-weight: 600;
  white-space: nowrap;
}

.jump-pills-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.jump-pill-btn {
  background: var(--color-pale-blue);
  border: 1px solid rgba(25, 118, 173, 0.2);
  color: var(--color-deep-blue);
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.jump-pill-btn:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

/* Legal Callout */
.legal-callout {
  background: linear-gradient(135deg, rgba(25, 118, 173, 0.06), rgba(30, 64, 175, 0.04));
  border: 1px solid rgba(25, 118, 173, 0.25);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: var(--space-2xl);
}

.callout-icon {
  color: var(--color-primary-blue);
  flex-shrink: 0;
  margin-top: 2px;
}

.callout-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin-bottom: 3px;
}

.callout-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  line-height: 1.55;
  margin: 0;
}

.search-results-info {
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: var(--space-lg);
}

/* Sections Stream */
.sections-stream {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.terms-section-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  background: #FFFFFF;
  transition: all 0.2s ease;
  scroll-margin-top: 20px;
}

.terms-section-card:hover {
  border-color: rgba(25, 118, 173, 0.45);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
}

.section-top-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-off-white);
  margin-bottom: var(--space-md);
}

.section-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-badge-tag {
  font-size: 0.6875rem;
  font-weight: 800;
  color: var(--color-primary-blue);
  background: var(--color-pale-blue);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.section-heading {
  font-size: 1.1875rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin: 0;
}

.section-intro-paragraph {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  line-height: 1.75;
  margin-bottom: var(--space-md);
}

/* Items Grid */
.section-items-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: var(--space-md);
}

.styled-item-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  border-inline-start: 3px solid var(--color-primary-blue);
  font-size: 0.875rem;
  line-height: 1.65;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.styled-item-card:hover {
  background: #FFFFFF;
  transform: translateX(-2px);
}

[dir="ltr"] .styled-item-card:hover {
  transform: translateX(2px);
}

.item-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.marker-number {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-blue);
  color: #FFFFFF;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.marker-dot {
  color: var(--color-primary-blue);
  font-size: 1.25rem;
  line-height: 1;
}

.item-content-body {
  flex: 1;
}

.item-bold-label {
  color: var(--color-deep-blue);
  font-weight: 700;
}

.item-text-body {
  color: var(--color-text-primary);
}

.section-extra-paragraph {
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  line-height: 1.75;
  margin-top: var(--space-sm);
}

.empty-search-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-xl);
  color: var(--color-text-tertiary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* Contact Banner */
.compliance-contact-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xl);
  padding: var(--space-xl);
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-top: var(--space-2xl);
  flex-wrap: wrap;
}

.banner-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-pill);
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-text {
  flex: 1 1 300px;
}

.banner-title {
  font-size: 0.9375rem;
  font-weight: 750;
  color: var(--color-deep-blue);
  margin: 0 0 4px;
}

.banner-desc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.banner-email-link {
  color: var(--color-primary-blue);
  font-weight: 700;
  text-decoration: underline;
  margin-inline-start: 4px;
}

.banner-cta-btn {
  display: inline-block;
  padding: 8px 18px;
  background: var(--color-deep-blue);
  color: #FFFFFF;
  border-radius: var(--radius-pill);
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.banner-cta-btn:hover {
  background: var(--color-primary-blue);
}

/* States */
.state-card {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl) var(--space-2xl);
  text-align: center;
}

.spinner-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9375rem;
  color: var(--color-primary-blue);
  font-weight: 600;
  margin-bottom: var(--space-xl);
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.skeleton-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 650px;
  margin: 0 auto;
}

.sk-bar {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e6e6e6 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.sk-bar.w-30 { width: 30%; height: 22px; }
.sk-bar.w-100 { width: 100%; }
.sk-bar.w-90 { width: 90%; }

.sk-card {
  height: 100px;
  background: #f7f7f7;
  border-radius: var(--radius-md);
  margin-top: 10px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Auth Needed Card (401) */
.auth-needed-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 540px;
  margin: 0 auto;
}

.auth-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-pill);
  background: var(--color-pale-blue);
  color: var(--color-primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.auth-card-title {
  font-size: 1.25rem;
  font-weight: 750;
  color: var(--color-deep-blue);
  margin-bottom: 8px;
}

.auth-card-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-xl);
}

.auth-action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: var(--radius-pill);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.auth-btn.primary {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

.auth-btn.primary:hover {
  background: var(--color-deep-blue);
}

.auth-btn.secondary {
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  color: var(--color-deep-blue);
}

.auth-btn.secondary:hover {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-alert-icon {
  color: var(--color-error);
  margin-bottom: 12px;
}

.error-heading {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-deep-blue);
  margin-bottom: 6px;
}

.error-message {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--space-lg);
  max-width: 480px;
}

/* Mobile */
@media (max-width: 640px) {
  .terms-hero-card,
  .terms-card-shell {
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
  }

  .hero-title {
    font-size: 1.35rem;
  }

  .terms-section-card {
    padding: var(--space-md);
  }

  .jump-pills-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
