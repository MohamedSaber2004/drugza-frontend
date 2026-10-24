import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { useI18n } from './composables/useI18n';
import { vLoading } from './directives/loading';
import { vReveal } from './directives/reveal';
import LoadingOverlay from './components/ui/LoadingOverlay.vue';
import Skeleton from './components/ui/Skeleton.vue';

const app = createApp(App);
const { t } = useI18n();

app.config.globalProperties.$t = t;

// Register global v-loading directive (for container blur + loading overlay)
app.directive('loading', vLoading);

// Register global v-reveal directive (scroll-triggered reveal animations)
app.directive('reveal', vReveal);

// Register global UI components
app.component('LoadingOverlay', LoadingOverlay);
app.component('Skeleton', Skeleton);

app.use(router);
app.mount('#app');
