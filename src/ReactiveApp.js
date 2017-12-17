import React from 'react'
import './App.css'

import {types} from 'mobx-state-tree'
import { observer } from 'mobx-react'

const Todo = types.model({
  id: types.number,
  name: types.string,
  owner: types.maybe(types.reference(types.late(() => User))),
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
      self.owner = userId
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

console.log('initialState:', store.toJSON())

const UserPickerView = observer(props =>
  <select
    value={props.user ? props.user.id : ""}
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

const App = observer((props) =>
  <div>
    <ul>
      <span>New todo:</span>
      <input type="text" value={store.newTodoName} onChange={(event) => store.changeNewName(event)}/>
      <button onClick={() => store.addTodo()}>Add</button>
      {
        store.todos.map(todo => {
          return <li key={todo.id}>
            <input type="checkbox" id={todo.id} defaultChecked={todo.done} onChange={() => todo.toggleDone(todo.id)}/>
            <input type="text" defaultValue={todo.name} onChange={(event) => todo.changeName(event)}/>
            <UserPickerView
              user={todo.user}
              store={store}
              onChange={userId => todo.setUser(userId)}
            />
          </li>
        })
      }
    </ul>
    <span>Still {store.pendingTodos} todos pending from {store.totalTodos}</span>
  </div>
)

export default App
