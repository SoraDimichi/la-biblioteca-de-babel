import { describe, it, expect } from "vitest";
import { ObjectPool } from "@/rendering/object-pool";

describe("ObjectPool", () => {
  it("creates objects via factory", () => {
    let counter = 0;
    const pool = new ObjectPool(
      () => ({ id: ++counter }),
      () => {}
    );

    const obj = pool.acquire();
    expect(obj.id).toBe(1);
    expect(pool.active).toBe(1);
  });

  it("reuses released objects", () => {
    const pool = new ObjectPool(
      () => ({ value: 0 }),
      (obj) => { obj.value = 0; }
    );

    const obj1 = pool.acquire();
    obj1.value = 42;
    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(obj2).toBe(obj1);
    expect(obj2.value).toBe(0);
  });

  it("tracks pool size", () => {
    const pool = new ObjectPool(
      () => ({}),
      () => {}
    );

    expect(pool.size).toBe(0);

    const a = pool.acquire();
    const b = pool.acquire();
    expect(pool.active).toBe(2);

    pool.release(a);
    expect(pool.size).toBe(1);
    expect(pool.active).toBe(1);

    pool.release(b);
    expect(pool.size).toBe(2);
    expect(pool.active).toBe(0);
  });

  it("grows on demand", () => {
    const pool = new ObjectPool(
      () => ({}),
      () => {}
    );

    const items = Array.from({ length: 10 }, () => pool.acquire());
    expect(pool.active).toBe(10);

    items.forEach((item) => pool.release(item));
    expect(pool.size).toBe(10);
    expect(pool.active).toBe(0);
  });
});
