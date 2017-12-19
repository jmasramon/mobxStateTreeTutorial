import React from 'react'
import './App.css'

import { types, applySnapshot, onSnapshot } from 'mobx-state-tree'
// import {asReduxStore, connectReduxDevtools} from 'mst-middlewares'
import { observer } from 'mobx-react'

const Todo = types.model({
  id: types.number,
  name: types.string,
  user: types.maybe(types.reference(types.late(() => User))),
  done: types.optional(types.boolean, false)
})
  .actions(self => {
    function changeName (event) {
      self.name = event.target.value
    }

    function toggleDone () {
      self.done = !self.done
    }

    function setUser (userId) {
      self.user = userId
      console.log('todo get user:', self)
    }

    return {changeName, toggleDone, setUser}
  })

const User = types.model({
  id: types.identifier(types.number),
  name: types.optional(types.string, '')
})

const RootStore = types.model({
  todos: types.array(Todo),
  users: types.optional(types.array(User), []),
  newTodoName: types.optional(types.string, '')
})
  .actions(self => {
    function addTodo () {
      self.todos.push(Todo.create({
        id: self.todos.length + 1,
        name: self.newTodoName
      }))
      self.newTodoName = ''
    }

    function changeNewName (event) {
      self.newTodoName = event.target.value
    }

    return {addTodo, changeNewName}
  })
  .views(self => ({
    get totalTodos () {
      return this.todos.length
    },

    get pendingTodos () {
      return this.todos.filter(todo => !todo.done).length
    }
  }))

const store = RootStore.create({
  todos: [
    {
      id: 1,
      name: 'buy milk',
      owner: 'Jordi',
      done: true
    },
    {
      id: 2,
      name: 'buy kk',
      owner: 'Marc',
      done: false
    }
  ],
  users: [
    {
      id: 1,
      name: 'Jordi'
    },
    {
      id: 2,
      name: 'Marc'
    }
  ]
})

// const store = asReduxStore(rootStore)
// connectReduxDevtools(require('remotedev'), rootStore)

console.log('initialState:', store.toJSON())
var states = []
var currentFrame = -1

onSnapshot(store, snapshot => {
  console.log(snapshot)
  if (currentFrame === states.length - 1) {
    currentFrame++
    states.push(snapshot)
  }
})

export function previousState () {
  if (currentFrame === 0) return
  currentFrame--
  applySnapshot(store, states[currentFrame])
}

export function nextState () {
  if (currentFrame === states.length - 1) return
  currentFrame++
  applySnapshot(store, states[currentFrame])
}

const UserPickerView = observer(props =>
  <select
    value={props.user ? props.user.id : ''}
    onChange={e => props.onChange(e.target.value)}
  >
    <option value="">-none-</option>
    {props.store.users.map(user =>
      <option value={user.id} key={user.id}>
        {user.name}
      </option>
    )}
  </select>
)

const TodoView = observer(props =>
  <li key={props.todo.id}>
    <input type="checkbox" id={props.todo.id} defaultChecked={props.todo.done} onChange={() => props.todo.toggleDone(props.todo.id)}/>
    <input type="text" defaultValue={props.todo.name} onChange={(event) => props.todo.changeName(event)}/>
    <UserPickerView
      user={props.todo.user}
      store={store}
      onChange={userId => props.todo.setUser(userId)}
    />
  </li>
)

const NewTodo = observer(props =>
  <div>
    <span>New todo:</span>
    <input type="text" value={props.store.newTodoName} onChange={(event) => props.store.changeNewName(event)}/>
    <button onClick={() => props.store.addTodo()}>Add</button>
  </div>
)

const Pending = observer(props =>
  <span>Still {props.store.pendingTodos} todos pending from {props.store.totalTodos}</span>
)

const App = observer((props) =>
  <div>
    <ul>
      <NewTodo store={store} />
      {
        store.todos.map(todo => {
          return <TodoView todo={todo} />
        })
      }
    </ul>
    <Pending store={store} />
  </div>
)

export default App
