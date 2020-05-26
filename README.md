# react-hooks-store

[![](https://img.shields.io/badge/React-≥16.8.0-yellow.svg)](https://reactjs.org/docs/hooks-intro.html)

**Language switching**：[English](https://github.com/kothing/react-hooks-store/blob/master/README.en.md)

## 目录

- [安装](https://github.com/kothing/react-hooks-store#安装)
- [使用](https://github.com/kothing/react-hooks-store#使用)
  - [顶层容器](https://github.com/kothing/react-hooks-store#顶层容器)
  - [数据中心](https://github.com/kothing/react-hooks-store#数据中心)
  - [middleware「中间件」](https://github.com/kothing/react-hooks-store#middleware中间件)
  - [子组件](https://github.com/kothing/react-hooks-store#子组件)
- [Demo](https://github.com/kothing/react-hooks-store#demo)
- [API](https://github.com/kothing/react-hooks-store#api)
  - [Provider](https://github.com/kothing/react-hooks-store#provider)
  - [useDispatch](https://github.com/kothing/react-hooks-store#usedispatch)
  - [useStore](https://github.com/kothing/react-hooks-store#usestore)
- [Typescript 支持](https://github.com/kothing/react-hooks-store#typescript-支持)


## 安装

> 依赖于 React 16.8 以上的版本

`npm i github:kothing/react-hooks-store`

## 使用


### 顶层容器

```jsx
/* index.jsx */

import React from "react";
import ReactDOM from "react-dom";
import Provider from "react-hooks-store";

import storeList from "./storeList";
import middlewares from "./middlewares";
import App from "./App";

// 建议项目中使用如下依赖
import "core-js/stable";
import "regenerator-runtime/runtime";

const Root = document.getElementById("root");

ReactDOM.render(
  <Provider stores={storeList} middlewares={middlewares}>
    <App />
  </Provider>,
  Root
);
```

### 数据中心

```jsx
/* storeList.js */

// 第一个 Store：
// 管理全局通知状态，类似于是否出去加载中。

const noticeInitialState = {
  loading: false
};

const noticeReducer = (state, action) => {
  switch (action.type) {
    case "LOADING_START":
      return {
        ...state,
        loading: true
      };
    case "LOADING_STOP":
      return {
        ...state,
        loading: false
      };
    default:
      return state;
  }
};

// 第二个 Store：
// todolist 数据列表。
const todolistInitialState = {
  data: []
};

const todolistReducer = (state, action) => {
  switch (action.type) {
    case "TODOLIST_INIT":
      return {
        ...state,
        data: action.payload
      };
    case "TODOLIST_DELETE":
      return {
        ...state,
        data: state.date.filter(item => item !== action.payload)
      };
    default:
      return state;
  }
};

const noticeStore = {
  name: "notice",
  initialState: noticeInitialState,
  reducer: noticeReducer
};

const todolistStore = {
  name: "todolist",
  initialState: todolistInitialState,
  reducer: todolistReducer
};

const storeList = [todolistStore, noticeStore];

export default storeList;
```

### middleware「中间件」

```jsx
/* middlewares.js */

// 第一个 middleware：
// 用来打印日志
const actionLog = ({ next, action, state }) => {
  console.log("发出 action：", action);
  console.log("当前数据状态是：", state);

  next(action);
};

// 第二个 middleware：
// 用来拦截 API 请求
const apiFetch = async ({ next, action }) => {
  // 如果 action 里面有 api 字段，则表示需要请求服务端数据作为 payload
  if (action.api) {
    // 数据请求前，全局通知进入 loading 状态
    next({ type: "LOADING_START" });

    const serverResponse = await fetch(api.url, {
      method: api.method,
      ...api.option
    });

    // 数据请求后，关闭全局通知 loading 状态
    next({ type: "LOADING_STOP" });

    const nextAction = {
      ...action,
      payload: action.payload || serverResponse.data
    };

    // 以新的数据触发一下个 action
    next(nextAction);
  } else {
    next(action);
  }
};

const middlewares = [actionLog, apiFetch];

export default middlewares;
```

### 子组件

```jsx
/* App.jsx */

import React from "react";
import { useStore, useDispatch } from "./react-hooks-store";

const GlobalLoading = () => {
  // 使用 useStore 方法得到对应的 state 数据
  const { loading } = useStore("notice");

  return loading ? "加载中..." : null;
};

const TodoList = () => {
  // 使用 useDispatch 的方法得到 dispatch，用来发送 action
  const dispatch = useDispatch();
  const todoList = useStore("todolist");

  React.useEffect(() => {
    dispatch({
      type: "TODOLIST_INIT",
      api: {
        url: "/todolist"
      }
    });
  }, []);

  const handleDelete = todo => () => {
    dispatch({
      type: "TODOLIST_DELETE",
      payload: todo
    });
  };

  return (
    <ul>
      {todoList.data.map(todo => (
        <li key={todo.id} onClick={handleDelete(todo)}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
};

const App = () => (
  <>
    <TodoList />
    <GlobalLoading />
  </>
);

export default App;
```

## DEMO


- **github 项目**：[todo-list](https://react-admin-boilerplate.now.sh/#/test/example2)  
  基于 react-hooks-store 示例

## API

### Provider

Provider 作为整个 APP 的父元素

```typescript
const Provider: <State, Action>(
  props: ProviderProps<State, Action>
) => JSX.Element;
```

- ProviderProps

Provider 组件接收开发者自定义的 stores 和 middlewares 作为参数

```typescript
interface ProviderProps<State, Action> {
  stores: Store<State, Action>[]; // Store 数组
  middlewares?: Middleware<Action>[]; // Middleware 数组
  children: JSX.Element[] | JSX.Element | React.ReactNode; // 项目根组件
}
```

- Store

每一个 store 作为一个数据仓库，包含：

1. name「唯一的名称」
2. initialState「初始化数据，可以是任何非 false 类型」
3. reducer「数据出处理中心」

```typescript
interface Store<State, Action> {
  name: string;
  initialState: State;
  reducer: Reducer<State, Action>;
}
```

- middleware

中间件作为一个函数，每一个 `dispatch(action)` 的发送都会经过中间件。
中间件函数接收有三个字段的对象：

1. next： 下一个中间件动作分发者。如果已经是最后一个则分发到 reducer
2. action：当前触发的 action
3. state：全局 store 的数据。注：是所有 store 的数据，而不是某一个 store 的数据，因此可以在中间件中根据全局 store 作出逻辑判断，再进行下一步操作

```typescript
type Middleware<Action> = ({
  next,
  action,
  state
}: {
  next: React.Dispatch<Action>;
  action: Action;
  state?: StoreData;
}) => void;
```

- Reducer

Reducer 作为数据处理器，接收 state「当前 store 的数据」、action「当前触发的 action」；  
返回一个新的 state，或者什么都不返回。  
注意：这里的 Reducer 和 Redux 的 reducer 不一样：如果 state 没有修改，则不需要返回原来的 state，或者返回 undeinfed。

```typescript
type Reducer<State, Action> = (
  state: State,
  action: Action
) => State | undefined;
```

### useDispatch

在组件内部通过 useDispatch 得到 dispatch 方法，通过 `dispatch(Action)` 的可以触发一个 action。  
如果想实现异步 dispatch 建议在 middleware 中操作。

```typescript
function useDispatch<Action>(): React.Dispatch<Action>;
```

### useStore

在组件内部通过 useStore 得到任何一个 store 获取全局 store 的数据。  
useStore 接收一个 namespace 可选参数。  
namespace 即任何一个 store 的名称，如果没有传递 namespace 则表示获取所有 store 数据。

```typescript
function useStore<State>(nameSpace?: string): State;
```

## Typescript 支持

如果项目选择 typescript 静态类型校验，那么 react-hooks-store 将会友好的支持，这样会保障你的项目更健硕。  
要想 react-hooks-store 与你的 TS 项目友好相处，只需要准备两个类型作为范形「具体传递与使用方式见：[API 章节](https://github.com/kothing/react-hooks-store#api)」：

### 1. State

State 告诉 react-hooks-store，你的项目的数据是什么样子。  
比如：

```ts
interface StateOne {
  loading: boolean;
}

interface DataItem {
  id: number;
  name: string;
}

interface StateTwo {
  data: DataItem[];
}

// 最终范形 State 可以是多个 state 类型的整合
export type State = StateOne | StateTwo;
```

### 2. Action

Action 则告诉 react-hooks-store，你的项目中可能发触发什么样的 action，以便检识别出错误的 action。

比如：

```ts
interface IApi {
  method?: string;
  url: string;
}

type ActionOne = { type: "LOADING_START" } | { type: "LOADING_STOP" };

type ActionTwo =
  | { type: "TODOLIST_INIT"; payload?: DataItem[]; api?: IApi }
  | { type: "TODOLIST_CLEAR" };

// 最终范形 Action 可以是多个 action 类型的整合
export type Action = ActionOne | ActionTwo;
```

## License

[MIT](https://github.com/kothing/react-hooks-store/blob/master/LICENSE)
