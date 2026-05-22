import { reaction } from 'mobx';

import { createMobxSelectorBridge } from '../../src/internal/mobx-selector-bridge.js';

type Listener = () => void;

class TestStore<TState> {
  private listeners = new Set<Listener>();

  constructor(private state: TState) {}

  get(): TState {
    return this.state;
  }

  set(nextState: TState): void {
    this.state = nextState;

    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribe(listener: Listener): { unsubscribe(): void } {
    this.listeners.add(listener);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

describe('createMobxSelectorBridge', () => {
  it('updates MobX reactions when the selected store value changes', () => {
    const store = new TestStore({ count: 0 });
    const bridge = createMobxSelectorBridge(store, (state) => state.count);
    const values: number[] = [];
    const disposeReaction = reaction(
      () => bridge.value,
      (value) => {
        values.push(value);
      },
    );

    store.set({ count: 1 });
    store.set({ count: 2 });

    expect(values).toEqual([1, 2]);

    disposeReaction();
    bridge.dispose();
  });

  it('uses a custom equality comparator before updating the observable value', () => {
    const store = new TestStore({ count: 0 });
    const bridge = createMobxSelectorBridge(store, (state) => state.count, {
      equals: (previous, next) =>
        Math.floor(previous / 10) === Math.floor(next / 10),
    });
    const values: number[] = [];
    const disposeReaction = reaction(
      () => bridge.value,
      (value) => {
        values.push(value);
      },
    );

    store.set({ count: 1 });
    store.set({ count: 9 });
    store.set({ count: 10 });

    expect(values).toEqual([10]);

    disposeReaction();
    bridge.dispose();
  });

  it('supports unsubscribe object return shape and stops updates after dispose', () => {
    const store = new TestStore({ count: 0 });
    const bridge = createMobxSelectorBridge(store, (state) => state.count);
    const values: number[] = [];
    const disposeReaction = reaction(
      () => bridge.value,
      (value) => {
        values.push(value);
      },
    );

    expect(store.listenerCount).toBe(1);

    bridge.dispose();
    bridge.dispose();
    store.set({ count: 1 });

    expect(store.listenerCount).toBe(0);
    expect(values).toEqual([]);

    disposeReaction();
  });

  it('ignores late store notifications after dispose', () => {
    let state = { count: 0 };
    let listener: Listener | undefined;
    const store = {
      get: () => state,
      subscribe: (nextListener: Listener) => {
        listener = nextListener;

        return {
          unsubscribe: () => {
            // This store intentionally keeps the captured listener to simulate
            // a late notification from an external store after disposal.
          },
        };
      },
    };
    const bridge = createMobxSelectorBridge(
      store,
      (nextState) => nextState.count,
    );
    const values: number[] = [];
    const disposeReaction = reaction(
      () => bridge.value,
      (value) => {
        values.push(value);
      },
    );

    bridge.dispose();
    state = { count: 1 };
    listener?.();

    expect(values).toEqual([]);
    expect(bridge.value).toBe(0);

    disposeReaction();
  });

  it('supports unsubscribe function return shape', () => {
    let listener: Listener | undefined;
    let unsubscribeCalls = 0;
    const store = {
      get: () => ({ count: 0 }),
      subscribe: (nextListener: Listener) => {
        listener = nextListener;

        return () => {
          unsubscribeCalls += 1;
          listener = undefined;
        };
      },
    };

    const bridge = createMobxSelectorBridge(store, (state) => state.count);

    expect(listener).toEqual(expect.any(Function));

    bridge.dispose();
    bridge.dispose();

    expect(unsubscribeCalls).toBe(1);
    expect(listener).toBeUndefined();
  });
});
