import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';
import type { TrpcContext } from './_core/context';

describe('Inventory Management', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testItemId: number;

  beforeAll(async () => {
    // Create a test caller without authentication context
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: 'https',
        headers: {},
      } as TrpcContext['req'],
      res: {} as TrpcContext['res'],
    };
    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    // Clean up test data
    if (testItemId) {
      try {
        await db.deleteInventoryItem(testItemId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should create an inventory item', async () => {
    const result = await caller.inventory.create({
      name: 'Test Chicken',
      category: 'protein',
      unit: 'lbs',
      currentQuantity: 100,
      minThreshold: 20,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf('number');
    testItemId = result.id!;
  });

  it('should list inventory items', async () => {
    const items = await caller.inventory.list();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    
    const testItem = items.find(item => item.id === testItemId);
    expect(testItem).toBeDefined();
    expect(testItem?.name).toBe('Test Chicken');
    expect(testItem?.category).toBe('protein');
  });

  it('should get inventory item by id', async () => {
    const item = await caller.inventory.getById({ id: testItemId });
    expect(item).toBeDefined();
    expect(item?.name).toBe('Test Chicken');
    expect(item?.currentQuantity).toBe('100.00');
    expect(item?.minThreshold).toBe('20.00');
  });

  it('should update inventory item', async () => {
    const result = await caller.inventory.update({
      id: testItemId,
      currentQuantity: 150,
      minThreshold: 30,
    });

    expect(result.success).toBe(true);

    const updated = await caller.inventory.getById({ id: testItemId });
    expect(updated?.currentQuantity).toBe('150.00');
    expect(updated?.minThreshold).toBe('30.00');
  });

  it('should count inventory and create count record', async () => {
    const result = await caller.inventory.count({
      inventoryItemId: testItemId,
      countedQuantity: 140,
      countedBy: 'Test User',
      notes: 'Test count',
    });

    expect(result.success).toBe(true);

    // Verify quantity was updated
    const item = await caller.inventory.getById({ id: testItemId });
    expect(item?.currentQuantity).toBe('140.00');

    // Verify count history
    const history = await caller.inventory.getCountHistory({ inventoryItemId: testItemId });
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    
    const latestCount = history[0];
    expect(latestCount.countedQuantity).toBe('140.00');
    expect(latestCount.previousQuantity).toBe('150.00');
    expect(latestCount.countedBy).toBe('Test User');
  });

  it('should delete inventory item', async () => {
    const result = await caller.inventory.delete({ id: testItemId });
    expect(result.success).toBe(true);

    const deleted = await caller.inventory.getById({ id: testItemId });
    expect(deleted).toBeNull();
    
    // Prevent cleanup from trying to delete again
    testItemId = 0;
  });
});
