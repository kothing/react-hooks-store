# react-hooks-store

[![](https://img.shields.io/badge/React-≥16.8.0-yellow.svg)](https://reactjs.org/docs/hooks-intro.html)

**语言选择**：[中文](https://github.com/kothing/react-hooks-store#hooks-store)

## catalogue

- [Foreword](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#foreword)
- [Installation](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#installation)
- [Usege](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#usege)
  - [Global Provider](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#global-provider)
  - [Data Center](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#data-center)
  - [middleware](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#middleware)
  - [Child Components](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#child-components)
- [Demo](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#demo)
- [API](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#api)
  - [Provider](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#provider)
  - [useDispatch](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#usedispatch)
  - [useStore](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#usestore)
- [The Typescript](https://github.com/kothing/react-hooks-store/blob/master/README.en.md#the-typescript)


## Installation

> Depends on React 16.8 and above

`npm i github:kothing/react-hooks-store`

## Usege

> Show simple react todolist demo build code here, the specific implementation can refer to [Demo chapter](https://github.com/kothing/react-hooks-store#demo)

### Global Provider

```jsx
/* index.jsx */

import React from "react";
import ReactDOM from "react-dom";
import Provider from "react-hooks-store";

import storeList from "./storeList";
import middlewares from "./middlewares";
import App from "./App";

// It is recommended to use the following dependencies in the project
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

### Data Center

```jsx
/* storeList.js */

// First Store:
// Manage global notification status, similar to whether to go out and load.

const noticeInitialState={
  loading: false
};

const noticeReducer = (state, action) => {
  switch (action.type) {
    case "LOADING_START":
      return {
        ... state,
        loading: true
      };
    case "LOADING_STOP":
      return {
        ... state,
        loading: false
      };
    default:
      return state;
  }
};

// Second Store:
// todolist data list.
const todolistInitialState={
  data: []
};

const todolistReducer = (state, action) => {
  switch (action.type) {
    case "TODOLIST_INIT":
      return {
        ... state,
        data: action.payload
      };
    case "TODOLIST_DELETE":
      return {
        ... state,
        data: state.date.filter (item => item! == action.payload)
      };
    default:
      return state;
  }
};

const noticeStore={
  name: "notice",
  initialState: noticeInitialState,
  reducer: noticeReducer
};

const todolistStore={
  name: "todolist",
  initialState: todolistInitialState,
  reducer: todolistReducer
};

const storeList = [todolistStore, noticeStore];

export default storeList;
```

### Middleware

```jsx
/* middlewares.js */

// The first middleware:
// used to print the log
const actionLog = ({ next, action, state }) => {
  console.log("Issue action:", action);
  console.log("The current data state is:", state);

  next(action);
};

// The second middleware:
// Used to intercept API requests
const apiFetch = async ({ next, action }) => {
  // If there is an api field in the action, it means that the server data needs to be requested as a payload
  if (action.api) {
    // Before data request, global notification enters loading state
    next({ type: "LOADING_START" });

    const serverResponse = await fetch(api.url, {
      method: api.method,
      ...api.option
    }); // After data request, turn off global notification loading status

    next({ type: "LOADING_STOP" });

    const nextAction = {
      ...action,
      payload: action.payload || serverResponse.data
    }; // Trigger an action with new data

    next(nextAction);
  } else {
    next(action);
  }
};

const middlewares = [actionLog, apiFetch];

export default middlewares;
```

### Child Components

```jsx
/* App.jsx */

import React from "react";
import { useStore, useDispatch } from "hooks-store";

const GlobalLoading = () => {
  // Use the useStore method to get the corresponding state data
  const { loading } = useStore("notice");

  return loading ? "Loading ..." : null;
};

const TodoList = () => {
  // Use dispatch method to get dispatch to send action
  const dispatch = useDispatch();
  const todoList = useStore("todolist");

  React.useEffect(() => {
    dispatch({
      type: "TODOLIST_INIT",
      api: {
        url: "/ todolist"
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

- **codesandbox project**: [simple-todolist](https://react-admin-boilerplate.now.sh/#/test/example2)  
   A simple version of todolist based on react-hooks-store

## API

### Provider

Provider as the parent element of the entire APP

```typescript
const Provider: <State, Action>(
  props: ProviderProps<State, Action>
) => JSX.Element;
```

- ProviderProps

Provider component receives developers-defined stores and middlewares as parameters

```typescript
interface ProviderProps<State, Action> {
  stores: Store<State, Action>[]; // Store array
  middlewares?: Middleware<Action>[]; // Middleware array
  children: JSX.Element[] | JSX.Element | React.ReactNode; // project root component
}
```

- Store

Each store as a data warehouse contains:

1. name "unique name"
2. initialState "initialized data, can be any non-false type"
3. reducer "data out processing center"

```typescript
interface Store<State, Action> {
  name: string;
  initialState: State;
  reducer: Reducer<State, Action>;
}
```

- middleware

Middleware is a function, and every dispatch (action) is sent through the middleware.
The middleware function receives an object with three fields:

1. next: The next middleware action distributor. If it is already the last one, it will be distributed to the reducer
2. action: the currently triggered action
3. state: Global store data. Note: It is the data of all stores, not the data of a certain store, so you can make a logical judgment based on the global store in the middleware, and then proceed to the next step

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

Reducer acts as a data processor, receiving state "data of the current store" and action "currently triggered action";
Returns a new state, or returns nothing.
Note: The Reducer here is not the same as the Redux reducer: if the state has not been modified, you do not need to return to the original state or return undeinfed.

```typescript
type Reducer<State, Action> = (
  state: State,
  action: Action
) => State | undefined;
```

### useDispatch

Inside the component, useDispatch to get the dispatch method, and use dispatch (Action) to trigger an action.
If you want to implement asynchronous dispatch, it is recommended to operate in middleware.

```typescript
function useDispatch<Action>(): React.Dispatch<Action>;
```

### useStore

Get the data of the global store from any store through the useStore inside the component.
useStore accepts an optional namespace parameter.
The namespace is the name of any store. If no namespace is passed, it means to get all store data.

```typescript
function useStore<State>(nameSpace?: string): State;
```

## The Typescript

If the project chooses typescript static type checking, then react hooks-store will support it friendly, which will ensure that your project is more robust.
In order to get react hooks-store to be friendly with your TS project, you only need to prepare two types as a paradigm. ) ":

### 1. State

State tells react hooks-store what your project data looks like.
such as:

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

// The final normal state can be the integration of multiple state types
export type State = StateOne | StateTwo;
```

### 2. Action

Action tells react hooks-store what kind of action may be triggered in your project in order to detect and identify the wrong action.

such as:

```ts
interface IApi {
  method?: string;
  url: string;
}

type ActionOne = { type: "LOADING_START" } | { type: "LOADING_STOP" };

type ActionTwo =
  | { type: "TODOLIST_INIT"; payload?: DataItem[]; api?: IApi }
  | { type: "TODOLIST_CLEAR" };

// The final paradigm action can be a combination of multiple action types
export type Action = ActionOne | ActionTwo;
```

## License

[MIT](https://github.com/kothing/react-hooks-store/blob/master/LICENSE)
