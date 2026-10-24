/* eslint-disable */
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module 'vue' {
  interface GlobalDirectives {
    vReveal: import('vue').Directive<HTMLElement, number | undefined>;
  }
}

export {};
