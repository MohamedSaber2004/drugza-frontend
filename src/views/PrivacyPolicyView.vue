<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  RefreshCw,
  Building2,
  Database,
  Sparkles,
  Share2,
  FileText,
  UserCheck,
  Scale,
  ShieldAlert,
  Globe
} from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import { policyService } from '@/services/policy.service';
import { useI18n } from '@/composables/useI18n';
import Button from '@/components/ui/Button.vue';
import Skeleton from '@/components/ui/Skeleton.vue';

interface PolicyItem {
  number?: string;
  label?: string;
  text: string;
}

interface PolicyPreamble {
  title: string;
  content: string;
}

interface PolicySection {
  id: string;
  number: number;
  badge: string;
  ordinal?: string;
  title: string;
  intro: string;
  items: PolicyItem[];
  paragraphs: string[];
}

const route = useRoute();
const { locale, toggleLocale } = useI18n();

const isMinimal = computed(() => {
  return route.path.startsWith('/auth') || route.query.minimal === 'true' || route.meta.hideNav === true;
});

const content = ref<string>('');
const isLoading = ref<boolean>(true);
const error = ref<string | null>(null);

async function loadPolicy() {
  isLoading.value = true;
  error.value = null;
  try {
    const langCode = locale.value === 'ar' ? 1 : 2;
    // Live API call: GET /api/Policy/get-policy?lang=1 or 2
    const res = await policyService.getPolicy(langCode);
    if (!res || !res.trim()) {
      throw new Error('Empty response');
    }
    content.value = res;
  } catch (err: any) {
    console.error('[PrivacyPolicyView] Error fetching policy:', err);
    error.value = locale.value === 'ar'
      ? 'تعذر جلب سياسة الخصوصية من الخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
      : 'Failed to retrieve privacy policy from the server. Please check your connection and try again.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadPolicy();
});

watch(locale, () => {
  loadPolicy();
});

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

const AR_POLICY_ORDINALS = [
  'أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً'
];

/**
 * Dynamically parse incoming API text into structured, styled sections
 * strictly ordered 1 to 5 (أولاً إلى خامساً) with document preamble.
 */
const parsedPolicy = computed<{ preamble: PolicyPreamble | null; sections: PolicySection[] }>(() => {
  if (!content.value) return { preamble: null, sections: [] };
  const lines = content.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { preamble: null, sections: [] };

  const sections: PolicySection[] = [];
  let preamble: PolicyPreamble | null = null;
  let currentSection: PolicySection | null = null;
  let nextExpectedNum = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Document title and preamble detection
    if (sections.length === 0 && !currentSection) {
      if (
        line === 'سياسة الخصوصية' ||
        line.toLowerCase().startsWith('privacy policy')
      ) {
        continue;
      }
      if (line === 'المقدمة' || line.startsWith('المقدمة:')) {
        preamble = {
          title: locale.value === 'ar' ? 'المقدمة والأحكام التمهيدية' : 'Introduction & Overview',
          content: ''
        };
        continue;
      }
      if (preamble && !preamble.content) {
        preamble.content = line;
        continue;
      }
    }

    let isSectionHeading = false;
    let badgeNum = nextExpectedNum;
    let sectionTitle = line;

    if (locale.value === 'ar') {
      for (let oIdx = AR_POLICY_ORDINALS.length - 1; oIdx >= 0; oIdx--) {
        const ord = AR_POLICY_ORDINALS[oIdx];
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
      const m = /^(\d+)\.\s+(.*)/.exec(line);
      if (m) {
        const num = parseInt(m[1], 10);
        const title = m[2].trim();
        if (num === nextExpectedNum) {
          isSectionHeading = true;
          badgeNum = num;
          sectionTitle = title;
        }
      }
    }

    if (isSectionHeading) {
      if (currentSection) {
        sections.push(currentSection);
      }
      nextExpectedNum = badgeNum + 1;
      const id = `sec-${badgeNum}`;
      const ordinal = locale.value === 'ar' ? AR_POLICY_ORDINALS[badgeNum - 1] : `${badgeNum}`;
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

      if (isNumItem) {
        const num = isNumItem[1];
        const rest = isNumItem[2].trim();
        if (rest.includes(':')) {
          const colonIdx = rest.indexOf(':');
          currentSection.items.push({
            number: num,
            label: rest.substring(0, colonIdx).trim(),
            text: rest.substring(colonIdx + 1).trim()
          });
        } else {
          currentSection.items.push({ number: num, text: rest });
        }
      } else if (isBullet) {
        const rest = isBullet[1].trim();
        if (rest.includes(':')) {
          const colonIdx = rest.indexOf(':');
          currentSection.items.push({
            label: rest.substring(0, colonIdx).trim(),
            text: rest.substring(colonIdx + 1).trim()
          });
        } else {
          currentSection.items.push({ text: rest });
        }
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

  return { preamble, sections };
});

const parsedSections = computed(() => parsedPolicy.value.sections);
const preamble = computed(() => parsedPolicy.value.preamble);

function getSectionIcon(index: number) {
  const icons = [Database, Sparkles, Share2, ShieldCheck, UserCheck];
  return icons[index % icons.length];
}
</script>

<template>
  <div class="privacy-page">
    <div class="drugza-container privacy-container">
      <!-- Minimal Auth Top Bar (when opened from register/auth) -->
      <div v-if="isMinimal" class="minimal-top-bar">
        <DrugzaLogo size="md" />
        <div class="minimal-top-actions">
          <button type="button" class="minimal-lang-btn" @click="toggleLocale">
            <Globe :size="16" />
            <span>{{ locale === 'ar' ? 'English' : 'اللغة العربية' }}</span>
          </button>
          <router-link to="/auth/register" class="minimal-close-btn">
            <span>{{ locale === 'ar' ? 'العودة للتسجيل' : 'Back to Register' }}</span>
          </router-link>
        </div>
      </div>

      <!-- Breadcrumb Navigation (only when full layout) -->
      <nav v-else class="privacy-breadcrumb" aria-label="Breadcrumb">
        <router-link to="/">{{ locale === 'ar' ? 'الرئيسية' : 'Home' }}</router-link>
        <span class="sep">/</span>
        <span class="current">{{ locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy' }}</span>
      </nav>

      <!-- Hero Header Card -->
      <header class="privacy-hero-card">
        <div class="hero-top-row">
          <div class="hero-icon-badge">
            <ShieldCheck :size="32" class="shield-icon" />
          </div>

          <div class="hero-text-block">
            <div class="compliance-pill">
              <Lock :size="12" />
              <span>{{ locale === 'ar' ? 'وثيقة قانونية رسمية • قانون حماية البيانات رقم 151 لسنة 2020' : 'Official Legal Policy • Data Protection Law No. 151 of 2020' }}</span>
            </div>

            <h1 class="hero-title">
              {{ locale === 'ar' ? 'سياسة الخصوصية وأمان البيانات' : 'Privacy & Data Protection Policy' }}
            </h1>

            <p class="hero-desc">
              {{ locale === 'ar'
                ? 'تلتزم منصة DrugZA بحماية وسرية البيانات الخاصة بالصيدليات والمخازن الدوائية الشريكة وفقاً لأعلى معايير التشفير والتشريعات المصرية المعمول بها.'
                : 'DrugZA platform is strictly committed to protecting the privacy and commercial security of all user pharmacies and distributors.'
              }}
            </p>
          </div>
        </div>

        <!-- 3 Security Pillars / Guarantees -->
        <div class="pillars-row">
          <div class="pillar-item">
            <div class="pillar-icon-box blue">
              <Scale :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ locale === 'ar' ? 'الامتثال لقانون 151 لسنة 2020' : 'Law 151/2020 Compliance' }}</strong>
              <p>{{ locale === 'ar' ? 'حماية تامة للبيانات التجارية والشخصية' : 'Full alignment with Egyptian statutory provisions' }}</p>
            </div>
          </div>

          <div class="pillar-item">
            <div class="pillar-icon-box green">
              <Lock :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ locale === 'ar' ? 'تشفير متقدم وسجلات آمنة' : 'Bank-Grade Encryption' }}</strong>
              <p>{{ locale === 'ar' ? 'حماية وتشفير الفواتير وطلبات الشراء' : 'End-to-end cryptographic protection for transactions' }}</p>
            </div>
          </div>

          <div class="pillar-item">
            <div class="pillar-icon-box orange">
              <UserCheck :size="18" />
            </div>
            <div class="pillar-text">
              <strong>{{ locale === 'ar' ? 'حظر بيع أو تأجير البيانات' : 'Zero Data Selling' }}</strong>
              <p>{{ locale === 'ar' ? 'عدم الإفصاح لأي أطراف دعائية خارجية' : 'Strict pledge against monetizing partner records' }}</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="policy-main-content">
        <!-- Loading State Skeleton -->
        <div v-if="isLoading" class="state-card loading-card" style="display: flex; flex-direction: column; gap: 18px; padding: 32px;">
          <div class="spinner-line" style="display: flex; align-items: center; gap: 10px; color: var(--color-primary-blue); font-weight: 600;">
            <RefreshCw :size="20" class="spin-animation" />
            <span>{{ locale === 'ar' ? 'جاري استرجاع بنود سياسة الخصوصية المعتمدة...' : 'Loading official privacy policy...' }}</span>
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

        <!-- Error State with Retry Button -->
        <div v-else-if="error" class="state-card error-card">
          <ShieldAlert :size="42" class="error-shield-icon" />
          <h3 class="error-heading">{{ locale === 'ar' ? 'تعذر جلب البيانات' : 'Data Retrieval Error' }}</h3>
          <p class="error-message">{{ error }}</p>
          <Button variant="primary" size="md" @click="loadPolicy">
            <RefreshCw :size="16" />
            <span>{{ locale === 'ar' ? 'إعادة المحاولة الآن' : 'Retry Now' }}</span>
          </Button>
        </div>

        <!-- Live Content Display -->
        <div v-else class="policy-card-shell">
          <!-- Quick Navigation Jump Pills -->
          <div v-if="parsedSections.length > 0" class="policy-jump-bar">
            <span class="jump-label">{{ locale === 'ar' ? 'الانتقال السريع للقسم:' : 'Jump to section:' }}</span>
            <div class="jump-pills-list">
              <button
                v-for="sec in parsedSections"
                :key="sec.id"
                type="button"
                class="jump-pill-btn"
                @click="scrollToSection(sec.id)"
              >
                {{ sec.ordinal ? (locale === 'ar' ? sec.ordinal : 'Section ' + sec.number) : sec.badge }}
              </button>
            </div>
          </div>

          <!-- Document Preamble Banner (if present in API) -->
          <div v-if="preamble && preamble.content" class="policy-preamble-card">
            <div class="preamble-header">
              <Sparkles :size="18" class="preamble-icon" />
              <h3 class="preamble-title">{{ preamble.title }}</h3>
            </div>
            <p class="preamble-body">{{ preamble.content }}</p>
          </div>

          <!-- Legal Validity Callout -->
          <div class="legal-callout">
            <CheckCircle2 :size="20" class="callout-icon" />
            <div>
              <strong class="callout-title">
                {{ locale === 'ar' ? 'سياسة نافذة ومعتمدة قانونياً:' : 'Legally Binding & Effective:' }}
              </strong>
              <p class="callout-desc">
                {{ locale === 'ar'
                  ? 'تم صياغة هذه السياسة لحماية الكيانات الدوائية المرخصة (صيدليات ومستودعات)، ويُعد استخدامك لمنصة DrugZA موافقة صريحة على بنود هذه السياسة.'
                  : 'This policy governs all operations between licensed pharmacies and medical distributors on DrugZA. Using our platform implies acceptance of these terms.'
                }}
              </p>
            </div>
          </div>

          <!-- Rich Styled Sections Stream -->
          <div class="sections-stream">
            <article
              v-for="(sec, idx) in parsedSections"
              :key="sec.id"
              :id="sec.id"
              class="policy-section-card"
            >
              <!-- Section Card Header -->
              <div class="section-top-bar">
                <div class="section-icon-bubble">
                  <component :is="getSectionIcon(idx)" :size="20" />
                </div>
                <div class="section-title-area">
                  <span class="section-badge-tag">{{ sec.badge }}</span>
                  <h2 class="section-heading">{{ sec.title }}</h2>
                </div>
              </div>

              <!-- Section Intro -->
              <p v-if="sec.intro" class="section-intro-paragraph">
                {{ sec.intro }}
              </p>

              <!-- Section Styled Items List -->
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

              <!-- Additional Paragraphs -->
              <p
                v-for="(para, pIdx) in sec.paragraphs"
                :key="pIdx"
                class="section-extra-paragraph"
              >
                {{ para }}
              </p>
            </article>
          </div>

          <!-- Compliance & Legal Contact Box -->
          <section class="compliance-contact-banner">
            <div class="banner-icon">
              <Building2 :size="26" />
            </div>
            <div class="banner-text">
              <h4 class="banner-title">{{ locale === 'ar' ? 'هل لديك أي استفسار بشأن حماية البيانات أو حسابك؟' : 'Questions regarding your data protection or account?' }}</h4>
              <p class="banner-desc">
                {{ locale === 'ar'
                  ? 'فريق الامتثال القانوني وحماية البيانات في دراجزا متاح للإجابة على استفساراتكم عبر البريد المعتمد:'
                  : 'DrugZA regulatory compliance desk is available to assist you anytime via email:'
                }}
                <a href="mailto:support@drugza.com" class="banner-email-link">support@drugza.com</a>
              </p>
            </div>
            <a href="mailto:support@drugza.com" class="banner-cta-btn">
              {{ locale === 'ar' ? 'مراسلة الدعم القانوني' : 'Contact Support' }}
            </a>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.privacy-page {
  padding: var(--space-2xl) 0 var(--space-4xl);
  background: var(--color-off-white);
  min-height: calc(100vh - 200px);
}

.privacy-container {
  max-width: 960px;
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
.privacy-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-lg);
}

.privacy-breadcrumb a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.privacy-breadcrumb a:hover {
  color: var(--color-primary-blue);
}

.privacy-breadcrumb .sep {
  color: var(--color-border);
}

.privacy-breadcrumb .current {
  color: var(--color-primary-blue);
  font-weight: 500;
}

/* Hero Header Card */
.privacy-hero-card {
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
.policy-card-shell {
  background: #FFFFFF;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

/* Jump Bar */
.policy-jump-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-xl);
  flex-wrap: wrap;
}

.jump-label {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.jump-pills-list {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
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
  transition: all 0.15s ease;
}

.jump-pill-btn:hover {
  background: var(--color-primary-blue);
  color: #FFFFFF;
}

/* Preamble Card */
.policy-preamble-card {
  background: linear-gradient(135deg, rgba(25, 118, 173, 0.05), rgba(240, 249, 255, 0.8));
  border: 1px solid rgba(25, 118, 173, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.preamble-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-blue);
  margin-bottom: 6px;
}

.preamble-title {
  font-size: 0.9375rem;
  font-weight: 750;
  color: var(--color-deep-blue);
  margin: 0;
}

.preamble-body {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
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

/* Sections Stream */
.sections-stream {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.policy-section-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  background: #FFFFFF;
  transition: all 0.2s ease;
  scroll-margin-top: 20px;
}

.policy-section-card:hover {
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

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.error-shield-icon {
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
  .privacy-hero-card,
  .policy-card-shell {
    padding: var(--space-lg);
    border-radius: var(--radius-lg);
  }

  .hero-title {
    font-size: 1.35rem;
  }

  .policy-section-card {
    padding: var(--space-md);
  }

  .policy-jump-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
