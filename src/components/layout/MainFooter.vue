<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  Mail,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-vue-next';
import DrugzaLogo from '@/components/ui/DrugzaLogo.vue';
import { useI18n } from '@/composables/useI18n';
import { categoriesService } from '@/services/categories.service';
import { encryptId } from '@/utils/id-crypto';
import type { Category } from '@/types';

const { t, locale } = useI18n();

const categories = ref<Category[]>([]);

onMounted(async () => {
  try {
    const list = await categoriesService.getCategories();
    const preferred = ['tablet', 'capsule', 'syrup', 'cream', 'drops', 'ointment', 'suspension', 'suppository', 'sachet'];
    const picked: Category[] = [];
    for (const name of preferred) {
      const hit = list.find(c => c.name.trim().toLowerCase() === name);
      if (hit) picked.push(hit);
      if (picked.length === 6) break;
    }
    for (const c of list) {
      if (picked.length === 6) break;
      if (!picked.includes(c)) picked.push(c);
    }
    categories.value = picked;
  } catch {
    categories.value = [];
  }
});
</script>

<template>
  <footer class="drugza-main-footer">
    <!-- Main Footer Content -->
    <div class="drugza-container footer-content-wrap">
      <div class="footer-grid">
        <!-- Col 1: Brand Info -->
        <div class="footer-col brand-col">
          <DrugzaLogo size="lg" :show-tagline="true" />
          <p class="brand-desc">
            {{ t('footer.desc') }}
          </p>

          <div class="regulatory-seal">
            <CheckCircle2 :size="16" class="seal-icon" />
            <span>{{ t('footer.operatingUnder') }}</span>
          </div>
        </div>

        <!-- Col 2: Marketplace Navigation Links -->
        <div class="footer-col">
          <h4 class="col-heading">{{ t('footer.marketplaceNav') }}</h4>
          <ul class="footer-links-list">
            <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
            <li><router-link to="/catalog">{{ t('nav.allProducts') }}</router-link></li>
            <li><router-link to="/flash-sales">🔥 {{ t('nav.flashSales') }}</router-link></li>
            <li><router-link to="/providers">{{ t('nav.distributors') }}</router-link></li>
            <li><router-link to="/categories">{{ t('nav.categories') }}</router-link></li>
            <li><router-link to="/favorites">❤️ {{ t('nav.favorites') }}</router-link></li>
            <li><router-link to="/orders">{{ t('nav.orders') }}</router-link></li>
          </ul>
        </div>

        <!-- Col 3: Therapeutic Categories -->
        <div class="footer-col">
          <h4 class="col-heading">{{ t('footer.medicalCategories') }}</h4>
          <ul class="footer-links-list">
            <li v-for="cat in categories" :key="cat.id">
              <router-link :to="'/categories/' + encryptId(cat.id)">
                {{ locale === 'ar' ? (cat.arabicName || cat.name) : cat.name }}
              </router-link>
            </li>
            <li v-if="categories.length === 0">
              <router-link to="/categories">{{ t('nav.categories') }}</router-link>
            </li>
          </ul>
        </div>

        <!-- Col 4: Modern Communication & Contact Channels -->
        <div class="footer-col contact-col">
          <h4 class="col-heading">{{ t('footer.directContact') }}</h4>
          <p class="contact-sub">{{ locale === 'ar' ? 'تواصل مباشرة مع مكتب العمليات الصيدلانية الموحد:' : 'Connect with our dedicated pharmaceutical operations desk:' }}</p>

          <div class="contact-cards-list">
            <!-- Official Email -->
            <a href="mailto:support@drugza.com" class="contact-action-card email">
              <div class="icon-circle blue">
                <Mail :size="18" />
              </div>
              <div class="contact-text">
                <span class="card-label">{{ t('footer.emailLabel') }}</span>
                <strong class="card-val">{{ t('footer.emailAddress') }}</strong>
              </div>
            </a>

            <!-- Physical Hub -->
            <div class="hub-location-row">
              <MapPin :size="16" class="loc-icon" />
              <span>{{ t('footer.location') }}</span>
            </div>

            <!-- Operating Hours -->
            <div class="operating-hours-row">
              <Clock :size="16" class="loc-icon" />
              <span>{{ t('footer.fleet') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Legal Bar -->
    <div class="footer-bottom-bar">
      <div class="drugza-container bottom-inner">
        <p class="copyright-text">
          {{ t('footer.copyright') }}
        </p>

        <div class="legal-links">
          <router-link to="/terms">{{ t('footer.terms') }}</router-link>
          <span class="sep">&bull;</span>
          <router-link to="/privacy">{{ t('footer.privacy') }}</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.drugza-main-footer {
  background-color: var(--color-white);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

/* Content Wrap */
.footer-content-wrap {
  padding-top: var(--space-3xl);
  padding-bottom: var(--space-3xl);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.6fr;
  gap: var(--space-2xl);
}

@media (max-width: 1100px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-xl);
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }
}

.brand-desc {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-top: var(--space-md);
  margin-bottom: var(--space-md);
  max-width: 360px;
}

.regulatory-seal {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-pale-blue);
  border: 1px solid rgba(25, 118, 173, 0.2);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-medium);
}

.seal-icon {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

.col-heading {
  font-size: 1rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue);
  margin-bottom: var(--space-md);
}

.footer-links-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-links-list a {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  transition: all var(--dur-fast) var(--ease-smooth);
  display: inline-block;
}

.footer-links-list a:hover {
  color: var(--color-primary-blue);
  transform: translateX(4px);
}

[dir="rtl"] .footer-links-list a:hover {
  transform: translateX(-4px);
}

/* Contact Column */
.contact-sub {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}

.contact-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--color-off-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}

.contact-action-card:hover {
  background: #FFFFFF;
  border-color: var(--color-primary-blue);
  box-shadow: var(--shadow-sm);
  transform: translateX(3px);
}

[dir="rtl"] .contact-action-card:hover {
  transform: translateX(-3px);
}

.icon-circle {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-circle.gold { background: #FEF3C7; color: #B45309; }
.icon-circle.green { background: #E8F8F5; color: var(--color-success); }
.icon-circle.blue { background: var(--color-primary-blue-light); color: var(--color-primary-blue); }

.contact-text {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
}

.card-val {
  font-size: 0.9375rem;
  color: var(--color-deep-blue);
  font-weight: var(--font-weight-bold);
}

.hub-location-row,
.operating-hours-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  padding-top: 4px;
}

.loc-icon {
  color: var(--color-primary-blue);
  flex-shrink: 0;
}

/* Bottom Bar */
.footer-bottom-bar {
  background-color: var(--color-off-white);
  border-top: 1px solid var(--color-border);
  padding: var(--space-md) 0;
  font-size: 0.75rem;
}

.bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.copyright-text {
  color: var(--color-text-secondary);
}

.legal-links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.legal-links a {
  color: var(--color-text-secondary);
}
.legal-links a:hover {
  color: var(--color-primary-blue);
}

.sep {
  color: var(--color-text-tertiary);
}

@media (max-width: 640px) {
  .bottom-inner {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>
