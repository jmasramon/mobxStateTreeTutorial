import React, { Component } from 'react'
import './App.css'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
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
      newTodoName: 'please add name'
    }
  }

  pendingTodos () {
    return this.state.todos.filter(todo => !todo.done).length
  }

  toggleDone (id) {
    const newTodos = this.state.todos.slice()
    const todo = newTodos.filter(todo => todo.id === id)[0]
    todo.done = !todo.done
    this.setState({todos: newTodos})
    console.log('this.state.todos:', this.state.todos)
  }

  changeName (id, event) {
    const todo = this.state.todos.filter(todo => todo.id === id)[0]
    todo.name = event.target.value
  }

  changeNewName (event) {
    this.setState({newTodoName: event.target.value})
  }

  addTodo () {
    console.log('adding todo name:', this.state.newTodoName)
    let newTodo = {
      id: this.state.todos.length + 1,
      name: this.state.newTodoName,
      owner: 'unknown',
      done: false
    }
    this.setState({todos: this.state.todos.concat(newTodo)})
    this.setState({newTodoName: 'please add name'})
    console.log('this.state.todos lenght:', this.state.todos.length)
  }

  render () {
    return (
      <div>
        <ul>
          <span>New todo:</span>
          <input type="text" value={this.state.newTodoName} onChange={(event) => this.changeNewName(event)}/>
          <button onClick={() => this.addTodo()}>Add</button>
          {
            this.state.todos.map(todo => {
              return <li key={todo.id}>
                <input type="checkbox" id={todo.id} defaultChecked={todo.done} onChange={() => this.toggleDone(todo.id)}/>
                <input type="text" defaultValue={todo.name} onChange={(event) => this.changeName(todo.id, event)}/>
              </li>
            })
          }
        </ul>
        <span>Still {this.pendingTodos()} todos pending from {this.state.todos.length}</span>
      </div>
    )
  }
}

export default App
