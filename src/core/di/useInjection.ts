import { defaultContainer, type InjectionToken } from './container';

/**
 * Vue Composable for resolving dependencies from the DI Container.
 */
export function useInjection<T>(token: InjectionToken<T>): T {
  return defaultContainer.resolve(token);
}
