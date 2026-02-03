import "reflect-metadata";

export class Container {
  private instances = new Map<any, any>();

  resolve<T>(target: any): T {
    if (this.instances.has(target)) {
      return this.instances.get(target);
    }

    const tokens = this.getClassDeps(target);

    const injections = tokens.map((token: any) => this.resolve(token));

    const instance = new target(...injections);

    this.instances.set(target, instance);
    return instance;
  }

  private getClassDeps(target: any) {
    return Reflect.getMetadata("design:paramtypes", target) || [];
  }
}

let globalContainer: Container | null = null;

export function setGlobalContainer(container: Container) {
  globalContainer = container;
}

export function getGlobalContainer(): Container {
  if (!globalContainer) {
    throw new Error("Container not initialized");
  }
  return globalContainer;
}
