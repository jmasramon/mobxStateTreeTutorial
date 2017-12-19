import { PLAYER_EVENTS } from './constants'

function Player (duration) {
  this._duration = duration
  this._time = 0
  this._speed = 1
  this._visitId = ''

  this._container = undefined
  this._dataSource = undefined

  this._timeline = undefined

  this._listeners = {}

  this._ticker = (() => {
    const STEP = 20
    let running = false

    const isRunning = () => running

    const stop = () => {
      running = false
      this._emit(PLAYER_EVENTS.PLAYING_STATUS_CHANGE, false)
    }
    const start = () => {
      running = true
      this._emit(PLAYER_EVENTS.PLAYING_STATUS_CHANGE, true)
    }

    const interval = setInterval(() => {
      if (isRunning()) {
        const time = this._time + STEP * this._speed
        if (time > 0 && time <= STEP * this._speed) {
          this._emit(PLAYER_EVENTS.TAB_TITLE_CHANGE, {id: '1513007538854', name: 'First Tab'})
        }
        if (time >= 35775 && time <= 35775 + STEP * this._speed) {
          this._emit(PLAYER_EVENTS.TAB_TITLE_CHANGE, {id: '1511539499813', name: 'Second Tab'})
        }
        if (time > this._duration) {
          stop()
          this.time = this._duration
        } if (time < 0) {
          stop()
          this.time = 0
        } else {
          this.time = time
        }
      }
    }, STEP)

    const kill = () => { clearInterval(interval) }

    return { stop, start, kill, isRunning }
  })()
}

Player.prototype = {
  init (container, dataSource) {
    this._container = container
    this._dataSource = dataSource
  },

  load (sessionId) {
    this._dataSource.timeline(sessionId)
      .then((timeline) => {
        this._timeline = timeline
        this._duration = timeline.duration
      })
  },

  play () {
    this._ticker.start()
  },
  pause () {
    this._ticker.stop()
  },

  kill () {
    this._ticker.kill()
  },

  get sessionId () {
    return this._visitId
  },
  get time () {
    return this._time
  },
  get speed () {
    return this._speed
  },
  get playing () {
    return this._ticker.isRunning()
  },

  addListener (event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }

    this._listeners[event].push(callback)
  },
  removeListener (event = null, callback = null) {
    if (callback) {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback)
    } else if (event) {
      this._listeners[event] = []
    } else {
      Object.keys(this._listeners).forEach(event => this.off(event))
    }
  },
  _emit (event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(listener => listener(data))
    }
  },

  set sessionId (sessionId) {
    this._visitId = sessionId
  },

  set time (time) {
    if (time > this._duration) {
      time = this._duration
    } else if (time < 0) {
      time = 0
    } else {
      time = Math.round(time)
    }

    if (time !== this._time) {
      this._time = time
      this._emit(PLAYER_EVENTS.TIME_CHANGE, time)
    }
  },

  set speed (speed) {
    this._speed = speed
    this._emit(PLAYER_EVENTS.SPEED_CHANGE, speed)
  }
}

export default Player
