import type { Directive } from 'vue';
import { useI18n } from '@/composables/useI18n';

type LoadingBindingValue = boolean | { loading: boolean; text?: string; blur?: number | false };

interface LoadingElement extends HTMLElement {
  __loadingOverlay?: HTMLElement;
  __loadingText?: HTMLElement;
  __loadingTimer?: ReturnType<typeof setTimeout>;
  __originalPosition?: string;
}

export const vLoading: Directive<LoadingElement, LoadingBindingValue> = {
  mounted(el, binding) {
    updateLoading(el, binding.value);
  },
  updated(el, binding) {
    updateLoading(el, binding.value);
  },
  unmounted(el) {
    if (el.__loadingTimer) clearTimeout(el.__loadingTimer);
    el.__loadingOverlay?.remove();
  }
};

function updateLoading(el: LoadingElement, value: LoadingBindingValue) {
  const isLoading = typeof value === 'object' && value !== null ? !!value.loading : !!value;
  const customText = typeof value === 'object' && value !== null ? value.text : undefined;
  const blur = typeof value === 'object' && value !== null ? value.blur : undefined;

  if (isLoading) {
    if (el.__loadingOverlay) {
      if (customText !== undefined && el.__loadingText) {
        el.__loadingText.textContent = customText;
        el.__loadingText.hidden = customText.length === 0;
      }
      return;
    }

    if (el.__loadingTimer) {
      clearTimeout(el.__loadingTimer);
      el.__loadingTimer = undefined;
    }

    const computedPosition = window.getComputedStyle(el).position;
    if (computedPosition === 'static' || !computedPosition) {
      el.__originalPosition = el.style.position;
      el.style.position = 'relative';
    }

    const { t } = useI18n();
    const text = customText ?? t('common.loading');

    el.classList.add('drugza-blur-active');
    el.style.setProperty('--drugza-loading-blur', blur === false ? '0px' : `${blur ?? 2}px`);
    el.setAttribute('aria-busy', 'true');

    const overlay = document.createElement('div');
    overlay.className = 'drugza-blur-overlay-element';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');

    const pill = document.createElement('div');
    pill.className = 'drugza-loading-pill';

    const spinner = document.createElement('span');
    spinner.className = 'drugza-loading-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'drugza-loading-text';
    label.textContent = text;
    label.hidden = text.length === 0;

    pill.append(spinner, label);
    overlay.appendChild(pill);
    el.appendChild(overlay);

    el.__loadingOverlay = overlay;
    el.__loadingText = label;

    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    return;
  }

  if (!el.__loadingOverlay) return;

  el.classList.remove('drugza-blur-active');
  el.removeAttribute('aria-busy');
  el.style.removeProperty('--drugza-loading-blur');

  const overlay = el.__loadingOverlay;
  overlay.classList.remove('is-visible');
  overlay.classList.add('is-hiding');

  el.__loadingTimer = setTimeout(() => {
    overlay.remove();
    if (el.__loadingOverlay === overlay) {
      el.__loadingOverlay = undefined;
      el.__loadingText = undefined;
    }
    if (el.__originalPosition !== undefined) {
      el.style.position = el.__originalPosition;
      delete el.__originalPosition;
    }
    el.__loadingTimer = undefined;
  }, 200);
}
