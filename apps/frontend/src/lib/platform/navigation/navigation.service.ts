/**
 * Sakani Platform Abstraction — Navigation Service Wrapper
 * Web delegates to next/navigation; Mobile delegates to @react-navigation/native.
 */

export interface NavigationOptions {
  scroll?: boolean;
}

export interface INavigationService {
  navigate(path: string, options?: NavigationOptions): void;
  back(): void;
  forward(): void;
  refresh(): void;
  replace(path: string, options?: NavigationOptions): void;
}

export interface RouterInstance {
  push(href: string, options?: NavigationOptions): void;
  back(): void;
  forward(): void;
  refresh(): void;
  replace(href: string, options?: NavigationOptions): void;
}

export const createWebNavigationService = (router: RouterInstance): INavigationService => ({
  navigate: (path, options) => router.push(path, options),
  back: () => router.back(),
  forward: () => router.forward(),
  refresh: () => router.refresh(),
  replace: (path, options) => router.replace(path, options),
});
