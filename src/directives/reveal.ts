import type { Directive } from 'vue';

type RevealElement = HTMLElement & {
  __revealBaseDelay?: number;
};

let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as RevealElement;
          const base = el.__revealBaseDelay ?? 0;
          el.style.transitionDelay = `${base + index * 70}ms`;
          el.classList.add('is-revealed');
          sharedObserver?.unobserve(el);
          window.setTimeout(() => {
            el.style.transitionDelay = '';
          }, base + index * 70 + 900);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );
  }
  return sharedObserver;
}

// v-reveal: reveals the element itself when it enters the viewport.
// v-reveal.children: staggers the reveal of the element's direct children.
// Optional numeric binding adds a base delay in ms.
export const vReveal: Directive<RevealElement, number | undefined> = {
  mounted(el, binding) {
    el.__revealBaseDelay = typeof binding.value === 'number' ? binding.value : 0;

    if (binding.modifiers.children) {
      el.classList.add('drugza-reveal-children');
      Array.from(el.children).forEach((child, i) => {
        (child as HTMLElement).style.setProperty('--reveal-i', String(i));
      });
    } else {
      el.classList.add('drugza-reveal');
    }

    getObserver().observe(el);
  },
  unmounted(el) {
    sharedObserver?.unobserve(el);
  }
};
