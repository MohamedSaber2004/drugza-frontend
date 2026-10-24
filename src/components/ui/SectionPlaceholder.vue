<script setup lang="ts">
import type { Component } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, ArrowLeft, Inbox } from 'lucide-vue-next';
import Button from '@/components/ui/Button.vue';
import { useI18n } from '@/composables/useI18n';

const props = withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    badge?: string;
    icon?: Component;
    variant?: 'section' | 'banner' | 'compact';
    actionText?: string;
    actionRoute?: string;
    minHeight?: string;
  }>(),
  {
    subtitle: '',
    badge: '',
    variant: 'section',
    actionText: '',
    actionRoute: '',
    minHeight: '220px'
  }
);

const router = useRouter();
const { isRtl } = useI18n();

function handleAction() {
  if (props.actionRoute) {
    router.push(props.actionRoute);
  }
}
</script>

<template>
  <div
    class="drugza-section-placeholder"
    :class="[`variant-${variant}`]"
    :style="{ minHeight }"
  >
    <!-- Ambient Backdrop Effects -->
    <div class="ambient-glow" aria-hidden="true"></div>
    <div class="decorative-pattern" aria-hidden="true"></div>

    <div class="placeholder-content">
      <!-- Badge if available -->
      <span v-if="badge" class="placeholder-badge">
        <span class="badge-dot"></span>
        {{ badge }}
      </span>

      <!-- Icon Box -->
      <div class="icon-orb">
        <component :is="icon || Inbox" :size="30" class="icon-svg" />
      </div>

      <!-- Text Content -->
      <div class="text-group">
        <h3 class="placeholder-title">{{ title }}</h3>
        <p v-if="subtitle" class="placeholder-subtitle">{{ subtitle }}</p>
      </div>

      <!-- Optional CTA Action -->
      <div v-if="actionText" class="action-wrap">
        <Button variant="secondary" size="sm" @click="handleAction">
          <span>{{ actionText }}</span>
          <component :is="isRtl ? ArrowLeft : ArrowRight" :size="15" class="action-icon" />
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drugza-section-placeholder {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xl, 16px);
  overflow: hidden;
  box-sizing: border-box;
  text-align: center;
  padding: var(--space-xl, 28px) var(--space-lg, 20px);
  transition: all var(--dur-base, 0.25s) var(--ease-smooth, ease);
}

/* Variant 1: Section (Cards / Grids) */
.variant-section {
  background: linear-gradient(180deg, #FBFCFE 0%, #F6F9FC 100%);
  border: 1px dashed var(--color-border-hover, #CBD5E1);
  box-shadow: inset 0 1px 2px rgba(18, 73, 107, 0.02);
}

.variant-section:hover {
  border-color: var(--color-primary-blue);
  background: linear-gradient(180deg, #FFFFFF 0%, #F4F9FD 100%);
}

/* Variant 2: Banner (Full-width promotional placeholders) */
.variant-banner {
  background: linear-gradient(135deg, #0B2B4D 0%, #0F3A66 60%, #134B80 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  box-shadow: 0 10px 25px -5px rgba(11, 43, 77, 0.15);
}

.variant-banner .placeholder-title {
  color: #FFFFFF;
}

.variant-banner .placeholder-subtitle {
  color: rgba(255, 255, 255, 0.8);
}

.variant-banner .icon-orb {
  background: rgba(20, 184, 166, 0.18);
  border-color: rgba(20, 184, 166, 0.4);
  color: #2DD4BF;
}

.variant-banner .placeholder-badge {
  background: rgba(255, 255, 255, 0.15);
  color: #5EEAD4;
  border-color: rgba(255, 255, 255, 0.2);
}

/* Variant 3: Compact */
.variant-compact {
  background: var(--color-off-white);
  border: 1px dashed var(--color-border);
  padding: var(--space-md, 16px);
}

/* Ambient glow */
.ambient-glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 140px;
  height: 140px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.decorative-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.7;
  pointer-events: none;
}

.placeholder-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  gap: 10px;
}

.placeholder-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(11, 43, 77, 0.06);
  color: var(--color-primary-blue, #0B2B4D);
  border: 1px solid rgba(11, 43, 77, 0.1);
  letter-spacing: 0.01em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #14B8A6;
  box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
}

.icon-orb {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.09);
  border: 1px solid rgba(20, 184, 166, 0.22);
  color: #0F766E;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(20, 184, 166, 0.07);
  transition: transform var(--dur-base) var(--ease-smooth);
}

.drugza-section-placeholder:hover .icon-orb {
  transform: scale(1.06);
}

.text-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.placeholder-title {
  font-size: 1.0625rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-deep-blue, #0B2B4D);
  margin: 0;
  line-height: 1.4;
}

.placeholder-subtitle {
  font-size: 0.84375rem;
  color: var(--color-text-secondary, #64748B);
  margin: 0;
  line-height: 1.55;
}

.action-wrap {
  margin-top: 4px;
}

.action-icon {
  margin-inline-start: 4px;
}
</style>
