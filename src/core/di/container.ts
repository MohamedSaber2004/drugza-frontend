export interface InjectionToken<T> {
  readonly description: string;
  readonly _type?: T;
}

export function createToken<T>(description: string): InjectionToken<T> {
  return { description };
}

type Factory<T> = (container: DIContainer) => T;

interface ServiceBinding<T> {
  factory: Factory<T>;
  isSingleton: boolean;
  instance?: T;
}

export class DIContainer {
  private bindings = new Map<InjectionToken<unknown>, ServiceBinding<unknown>>();

  /**
   * Register a pre-constructed instance as a singleton.
   */
  registerInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.bindings.set(token as InjectionToken<unknown>, {
      factory: () => instance,
      isSingleton: true,
      instance
    });
  }

  /**
   * Register a factory function as a singleton (lazy evaluated once and cached).
   */
  registerSingleton<T>(token: InjectionToken<T>, factory: Factory<T>): void {
    this.bindings.set(token as InjectionToken<unknown>, {
      factory: factory as Factory<unknown>,
      isSingleton: true
    });
  }

  /**
   * Register a factory function as transient (new instance created on each resolve).
   */
  registerTransient<T>(token: InjectionToken<T>, factory: Factory<T>): void {
    this.bindings.set(token as InjectionToken<unknown>, {
      factory: factory as Factory<unknown>,
      isSingleton: false
    });
  }

  /**
   * Resolve an instance for the provided injection token.
   */
  resolve<T>(token: InjectionToken<T>): T {
    const binding = this.bindings.get(token as InjectionToken<unknown>) as ServiceBinding<T> | undefined;

    if (!binding) {
      throw new Error(`[DIContainer] No provider registered for token: ${token.description}`);
    }

    if (binding.isSingleton) {
      if (binding.instance === undefined) {
        binding.instance = binding.factory(this);
      }
      return binding.instance;
    }

    return binding.factory(this);
  }

  /**
   * Check if a token is registered in the container.
   */
  has<T>(token: InjectionToken<T>): boolean {
    return this.bindings.has(token as InjectionToken<unknown>);
  }

  /**
   * Reset the container (useful for test suites or resets).
   */
  clear(): void {
    this.bindings.clear();
  }
}

export const defaultContainer = new DIContainer();
