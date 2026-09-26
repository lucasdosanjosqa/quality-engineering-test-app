import type { TestFaultState, TestFaultTarget } from '@commerceops/contracts';

import { AppError } from '../errors/app-error.js';

export class FaultController {
  private readonly faults: Record<TestFaultTarget, boolean> = {
    'products.list': false,
    'products.detail': false,
    'products.write': false,
  };

  getState(): TestFaultState {
    return { faults: { ...this.faults } };
  }

  set(target: TestFaultTarget, enabled: boolean): TestFaultState {
    this.faults[target] = enabled;
    return this.getState();
  }

  reset(): void {
    for (const target of Object.keys(this.faults) as TestFaultTarget[]) {
      this.faults[target] = false;
    }
  }

  throwIfActive(target: TestFaultTarget): void {
    if (this.faults[target]) {
      throw new AppError(
        503,
        'TEST_FAULT_ACTIVE',
        'A deterministic test fault is active for this operation.',
        { target },
      );
    }
  }
}
