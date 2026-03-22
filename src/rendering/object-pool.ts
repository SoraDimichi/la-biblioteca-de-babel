export class ObjectPool<T> {
  private pool: T[] = [];
  private activeCount = 0;

  constructor(
    private factory: () => T,
    private reset: (obj: T) => void
  ) {}

  acquire(): T {
    this.activeCount++;
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T) {
    this.activeCount--;
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }

  get active(): number {
    return this.activeCount;
  }
}
