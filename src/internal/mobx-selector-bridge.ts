import { observable, runInAction } from 'mobx';

export type StoreSubscription = { unsubscribe(): void } | (() => void);

export type SubscribableStore<TState> = {
  get(): TState;
  subscribe(listener: () => void): StoreSubscription;
};

export type Selector<TState, TValue> = (state: TState) => TValue;

export type SelectorEquality<TValue> = (
  previous: TValue,
  next: TValue,
) => boolean;

export type MobxSelectorBridge<TValue> = {
  readonly value: TValue;
  dispose(): void;
};

export type MobxSelectorBridgeOptions<TValue> = {
  equals?: SelectorEquality<TValue>;
};

export function createMobxSelectorBridge<TState, TValue>(
  store: SubscribableStore<TState>,
  selector: Selector<TState, TValue>,
  options: MobxSelectorBridgeOptions<TValue> = {},
): MobxSelectorBridge<TValue> {
  const equals = options.equals ?? Object.is;
  const selectedValue = observable.box(selector(store.get()), { deep: false });
  let disposed = false;

  const update = (): void => {
    if (disposed) {
      return;
    }

    const previous = selectedValue.get();
    const next = selector(store.get());

    if (equals(previous, next)) {
      return;
    }

    runInAction(() => {
      if (!disposed) {
        selectedValue.set(next);
      }
    });
  };

  const subscription = store.subscribe(update);

  return {
    get value(): TValue {
      return selectedValue.get();
    },
    dispose(): void {
      if (disposed) {
        return;
      }

      disposed = true;

      if (typeof subscription === 'function') {
        subscription();
      } else {
        subscription.unsubscribe();
      }
    },
  };
}
