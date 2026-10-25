<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useLoading } from '@/composables/useLoading';
import { useI18n } from '@/composables/useI18n';
import DrugzaLogo from './DrugzaLogo.vue';

const { isPageLoading, isApiLoading, isGlobalLoading } = useLoading();
const { t } = useI18n();

const shouldShow = ref(false);
let showTimer: any = null;
let minDisplayTimer: any = null;
let hasDisplayedAt: number = 0;

// Debounced appearance so micro-fast (instant cache) requests don't cause screen flicker
watch(isGlobalLoading, (loading) => {
  if (loading) {
    if (showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      shouldShow.value = true;
      hasDisplayedAt = Date.now();
    }, 90);
  } else {
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    const elapsed = Date.now() - hasDisplayedAt;
    const remainingMinDisplay = Math.max(0, 220 - elapsed);

    if (minDisplayTimer) clearTimeout(minDisplayTimer);
    minDisplayTimer = setTimeout(() => {
      shouldShow.value = false;
    }, remainingMinDisplay);
  }
}, { immediate: true });

const primaryMessage = computed(() => {
  if (isPageLoading.value) {
    return t('common.navigating');
  }
  return t('common.syncingData');
});
</script>

<template>
  <Transition name="global-loader-fade">
    <div
      v-if="shouldShow"
      class="global-loader-backdrop"
      role="status"
      aria-busy="true"
      :aria-label="primaryMessage"
    >
      <div class="loader-ambient-glow"></div>

      <!-- Center Load Balancer Hub Card -->
      <div class="load-balancer-card">
        <!-- Logo with Orbital Load-Balancing Nodes -->
        <div class="brand-orbit-wrapper">
          <div class="orbit-track track-1">
            <div class="orbit-node node-cyan"></div>
            <div class="orbit-node node-gold"></div>
          </div>
          <div class="orbit-track track-2">
            <div class="orbit-node node-blue"></div>
          </div>

          <!-- Official Drugza Logo in Center -->
          <div class="logo-core">
            <DrugzaLogo size="lg" :show-tagline="false" />
          </div>
        </div>

        <!-- Dynamic Load Balancer Stream Equalizer -->
        <div class="stream-equalizer" aria-hidden="true">
          <span class="eq-bar bar-1"></span>
          <span class="eq-bar bar-2"></span>
          <span class="eq-bar bar-3"></span>
          <span class="eq-bar bar-4"></span>
          <span class="eq-bar bar-5"></span>
          <span class="eq-bar bar-6"></span>
          <span class="eq-bar bar-7"></span>
        </div>

        <!-- Status & Messages -->
        <div class="loader-meta">
          <h3 class="loader-primary-text">{{ primaryMessage }}</h3>
          <div class="network-status-badge">
            <span class="pulse-live-dot"></span>
            <span>{{ t('common.liveDataStream') }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.global-loader-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 246, 252, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  user-select: none;
  overflow: hidden;
}

.loader-ambient-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(20, 184, 166, 0.18) 0%, rgba(25, 118, 173, 0.12) 40%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
  animation: ambient-pulse 4s ease-in-out infinite alternate;
}

/* Central Card */
.load-balancer-card {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 48px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(25, 118, 173, 0.16);
  border-radius: 28px;
  box-shadow:
    0 24px 64px -12px rgba(18, 73, 107, 0.16),
    0 12px 24px -8px rgba(18, 73, 107, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.9);
  max-width: 440px;
  width: 90%;
  text-align: center;
  gap: 22px;
  overflow: hidden;
}

.load-balancer-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    105deg,
    transparent 38%,
    rgba(25, 118, 173, 0.07) 50%,
    transparent 62%
  );
  transform: translateX(-120%);
  animation: loader-card-sheen 2.8s var(--ease-smooth) infinite;
  pointer-events: none;
}

/* Brand Orbit */
.brand-orbit-wrapper {
  position: relative;
  width: 170px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-core {
  position: relative;
  z-index: 5;
  animation: logo-breathe 2.4s ease-in-out infinite;
}

.logo-core::after {
  content: '';
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0 62%,
    rgba(25, 118, 173, 0.9) 82%,
    rgba(243, 206, 121, 0.95) 94%,
    transparent 100%
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px));
  animation: loader-ring-spin 1.5s linear infinite;
  pointer-events: none;
}

.orbit-track {
  position: absolute;
  border-radius: 50%;
  border: 1.5px dashed rgba(25, 118, 173, 0.2);
  pointer-events: none;
}

.orbit-track.track-1 {
  width: 150px;
  height: 90px;
  animation: orbit-spin 4s linear infinite;
}

.orbit-track.track-2 {
  width: 170px;
  height: 104px;
  border-color: rgba(20, 184, 166, 0.22);
  animation: orbit-spin-reverse 6s linear infinite;
}

.orbit-node {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 12px currentColor;
}

.node-cyan {
  top: -5px;
  left: 50%;
  background: #14B8A6;
  color: #14B8A6;
}

.node-gold {
  bottom: -5px;
  left: 50%;
  background: #F3CE79;
  color: #F3CE79;
}

.node-blue {
  top: 50%;
  right: -5px;
  background: #1976AD;
  color: #1976AD;
}

/* Equalizer Bars */
.stream-equalizer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 28px;
}

.eq-bar {
  width: 4px;
  height: 10px;
  background: linear-gradient(180deg, #1976AD 0%, #14B8A6 100%);
  border-radius: 9999px;
  animation: eq-balance 1.1s ease-in-out infinite alternate;
}

.bar-1 { animation-delay: 0.1s; height: 12px; }
.bar-2 { animation-delay: 0.3s; height: 18px; }
.bar-3 { animation-delay: 0.5s; height: 26px; }
.bar-4 { animation-delay: 0.2s; height: 22px; }
.bar-5 { animation-delay: 0.4s; height: 28px; }
.bar-6 { animation-delay: 0.15s; height: 16px; }
.bar-7 { animation-delay: 0.35s; height: 12px; }

/* Text */
.loader-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.loader-primary-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #12496B;
  letter-spacing: -0.01em;
  margin: 0;
}

.network-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(20, 184, 166, 0.08);
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #0d9488;
}

.pulse-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #14B8A6;
  box-shadow: 0 0 6px #14B8A6;
  animation: live-dot-pulse 1.2s ease-in-out infinite;
}

/* Animations */
@keyframes loader-ring-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes loader-card-sheen {
  0% { transform: translateX(-120%); }
  55%, 100% { transform: translateX(120%); }
}

@keyframes orbit-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes orbit-spin-reverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes logo-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes eq-balance {
  0% { height: 6px; opacity: 0.5; }
  100% { height: 26px; opacity: 1; }
}

@keyframes live-dot-pulse {
  0%, 100% { transform: scale(0.9); opacity: 0.6; }
  50% { transform: scale(1.4); opacity: 1; }
}

@keyframes ambient-pulse {
  0% { transform: scale(0.9); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0.9; }
}

/* Transitions */
.global-loader-fade-enter-active,
.global-loader-fade-leave-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.25s ease;
}

.global-loader-fade-enter-from,
.global-loader-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}
</style>
