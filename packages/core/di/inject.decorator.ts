import { getGlobalContainer } from "./di-container";

export function inject<T>(target: new (...args: any[]) => T): T {
  return getGlobalContainer().resolve<T>(target);
}
