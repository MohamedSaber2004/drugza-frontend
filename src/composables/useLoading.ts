import { ref, computed } from 'vue';

export type SkeletonType = 'default' | 'catalog' | 'grid' | 'orders' | 'table' | 'profile' | 'form' | 'detail' | 'content';

// Fast navigations should never flash a skeleton; only show it once the
// transition has taken long enough to actually be noticed.
const SKELETON_DELAY = 140;
const SKELETON_MIN_VISIBLE = 380;

const isPageLoading = ref(false);
const isSkeletonVisible = ref(false);
const isApiLoading = ref(false);
const activeRequestsCount = ref(0);
const pageSkeletonType = ref<SkeletonType>('default');
const loadingProgress = ref(0);

let progressInterval: ReturnType<typeof setInterval> | null = null;
let pageLoadTimer: ReturnType<typeof setTimeout> | null = null;
let skeletonShowTimer: ReturnType<typeof setTimeout> | null = null;
let skeletonHideTimer: ReturnType<typeof setTimeout> | null = null;
let skeletonShownAt = 0;

function startProgressAnimation() {
  if (progressInterval) return;
  loadingProgress.value = 10;
  progressInterval = setInterval(() => {
    if (loadingProgress.value < 88) {
      const increment = Math.max(1, (88 - loadingProgress.value) / 12);
      loadingProgress.value = Math.min(88, loadingProgress.value + increment);
    }
  }, 120);
}

function completeProgressAnimation() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  loadingProgress.value = 100;
  setTimeout(() => {
    if (activeRequestsCount.value === 0 && !isPageLoading.value) {
      loadingProgress.value = 0;
    }
  }, 300);
}

function scheduleSkeleton() {
  if (skeletonHideTimer) {
    clearTimeout(skeletonHideTimer);
    skeletonHideTimer = null;
  }
  if (isSkeletonVisible.value || skeletonShowTimer) return;

  skeletonShowTimer = setTimeout(() => {
    skeletonShowTimer = null;
    if (!isPageLoading.value) return;
    isSkeletonVisible.value = true;
    skeletonShownAt = Date.now();
  }, SKELETON_DELAY);
}

function hideSkeleton() {
  if (skeletonShowTimer) {
    clearTimeout(skeletonShowTimer);
    skeletonShowTimer = null;
  }
  if (!isSkeletonVisible.value) return;

  const elapsed = Date.now() - skeletonShownAt;
  const remaining = Math.max(0, SKELETON_MIN_VISIBLE - elapsed);

  if (skeletonHideTimer) clearTimeout(skeletonHideTimer);
  skeletonHideTimer = setTimeout(() => {
    skeletonHideTimer = null;
    if (!isPageLoading.value) {
      isSkeletonVisible.value = false;
    }
  }, remaining);
}

function clearPageLoadTimer() {
  if (pageLoadTimer) {
    clearTimeout(pageLoadTimer);
    pageLoadTimer = null;
  }
}

export const loadingService = {
  /**
   * Called by router before navigation.
   */
  startPageLoading(type: SkeletonType = 'default') {
    pageSkeletonType.value = type;
    isPageLoading.value = true;
    scheduleSkeleton();
    startProgressAnimation();

    // Safety timeout: ensure page loading never hangs indefinitely.
    clearPageLoadTimer();
    pageLoadTimer = setTimeout(() => {
      pageLoadTimer = null;
      isPageLoading.value = false;
      hideSkeleton();
      completeProgressAnimation();
    }, 5000);
  },

  /**
   * Called by router after navigation.
   */
  finishPageLoading() {
    clearPageLoadTimer();
    isPageLoading.value = false;
    hideSkeleton();

    if (activeRequestsCount.value === 0) {
      completeProgressAnimation();
    }
  },

  /**
   * Called by axios request interceptor.
   */
  startApiRequest() {
    activeRequestsCount.value++;
    isApiLoading.value = true;
    startProgressAnimation();
  },

  /**
   * Called by axios response/error interceptor.
   */
  finishApiRequest() {
    activeRequestsCount.value = Math.max(0, activeRequestsCount.value - 1);
    if (activeRequestsCount.value === 0) {
      isApiLoading.value = false;
      if (!isPageLoading.value) {
        completeProgressAnimation();
      }
    }
  },

  /**
   * Execute an async action while showing the page skeleton.
   */
  async withLoading<T>(fn: () => Promise<T>, type?: SkeletonType): Promise<T> {
    if (type) pageSkeletonType.value = type;
    isPageLoading.value = true;
    scheduleSkeleton();
    startProgressAnimation();
    try {
      return await fn();
    } finally {
      isPageLoading.value = false;
      hideSkeleton();
      completeProgressAnimation();
    }
  }
};

export function useLoading() {
  const isGlobalLoading = computed(() => isPageLoading.value || isApiLoading.value);

  return {
    isPageLoading,
    isSkeletonVisible,
    isApiLoading,
    isGlobalLoading,
    pageSkeletonType,
    loadingProgress,
    startPageLoading: loadingService.startPageLoading,
    finishPageLoading: loadingService.finishPageLoading,
    startApiRequest: loadingService.startApiRequest,
    finishApiRequest: loadingService.finishApiRequest,
    withLoading: loadingService.withLoading
  };
}
