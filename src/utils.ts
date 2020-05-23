import { StoreData, Store } from './types';

export const getInitialState = <State, Action>(
  stores: Store<State, Action>[]
): StoreData =>
  stores.reduce(
    (pre, cur) => ({
      ...pre,
      [cur.name]: cur.initialState
    }),
    {}
  );

const isStateChanged = <State>(current: State, next: State) => {
  // nextCurrentState 为 null 或者 undefined 表示没有进行数据处理
  if (next == null) {
    return false;
  }

  return current !== next;
};

export const getComdbinedReducer = <State, Action>(
  stores: Store<State, Action>[]
) => (state: StoreData, action: Action): StoreData => {
  let index = 0;

  while (index < stores.length) {
    const currentStore = stores[index++];
    const currentState = state[currentStore.name];
    const nextCurrentState = currentStore.reducer(currentState, action);

    if (isStateChanged(currentState, nextCurrentState)) {
      return {
        ...state,
        [currentStore.name]: nextCurrentState
      };
    }
  }

  return state;
};
