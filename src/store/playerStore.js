import { types, flow, getParent } from 'mobx-state-tree'
import {timeline} from '../api/api'
import { PLAYER_EVENTS } from '../player/constants'

/* eslint-disable no-use-before-define */

const SPEEDS = {
  0: 1,
  1: 2,
  2: 5,
  3: 10
}

let player

const View = types.model('View', {
  id: '',
  start: 0,
  duration: 0,
  url: '',
  tab_id: ''
})

export const Session = types.model('Session', {
  id: '',
  start: 0,
  duration: 0,
  views: types.optional(types.array(View), [])
})
  .views(self => { // Sadly they also use views for computed propterties
    return {
    }
  })
  .actions(self => ({
    setVisitId (sessionId) {
      console.log('setting sessionId:', sessionId)
      self.id = sessionId
    }
  }))

const Timeline = types.model('Timeline', {
  id: 0
})
  .views(self => {
    return {
      get pos () {
        return 100 / getParent(self).session.duration * getParent(self).time
      }
    }
  })

function lastTab (tabs) {
  return tabs.slice(-1)[0]
}

function sameDomain (newUrl, previousUrl) {
  return domain(newUrl) === domain(previousUrl)
}

function domain (url) {
  let hostname

  if (url.indexOf('://') > -1) {
    hostname = url.split('/')[2]
  } else {
    hostname = url.split('/')[0]
  }
  return hostname
}

function increaseTabDuration (tab, view) {
  tab.duration += view.duration
}

function addTab (tabs, view) {
  tabs.push({
    id: view.tab_id,
    url: view.url,
    startTime: view.startTime,
    duration: view.duration
  })
}

function initialTab (preparedViews) {
  if (preparedViews.length) {
    const initialTab = {
      id: preparedViews[0].tab_id,
      url: preparedViews[0].url,
      startTime: preparedViews[0].startTime,
      duration: preparedViews[0].duration
    }
    return initialTab
  }
  return {}
}

export const TabName = types.model('TabName', {
  id: '',
  name: ''
})

export const SessionPlayer = types.model('SessionPlayer', {
  session: types.optional(Session, {}),
  playing: false,
  speedIndex: 0,
  fullScreen: false,
  loading: true,
  time: 0,
  // errors: types.optional(types.array(types.string), []),
  timeline: types.optional(Timeline, {}),
  tabNames: types.optional(types.array(TabName), []),
  fadingIn: false
})
  .views(self => {
    return {
      get speed () {
        return SPEEDS[self.speedIndex]
      },

      get hasTimelineData () {
        return !!self.session && Object.keys(self.session).length > 0
      },

      get activeViewId () {
        if (self.preparedViews.length) {
          const curActiveViewId = self.preparedViews.reduce((acc, view) => {
            if (self.timeline.pos > view.startPos && self.timeline.pos < view.startPos + view.duration) {
              return view.id
            }
            return acc
          }, 0)
          return curActiveViewId
        }
      },

      get preparedViews () {
        if (self.hasTimelineData) {
          return prepareViews(self.session)
        }
        return []
      },

      get tabs () {
        return self.preparedViews
          .slice(1) // the first tab is the acc initial state
          .reduce((acc, view) => {
            if (view.tab_id === lastTab(acc).tab_id || sameDomain(view.url, lastTab(acc).url)) {
              increaseTabDuration(acc[acc.length - 1], view)
            } else {
              addTab(acc, view)
            }
            return acc
          }, [initialTab(self.preparedViews)])
      },

      tabName (tabId) {
        return self.tabNames.find(tab => tab.id === tabId)
      },

      get activeTabId () {
        const activeTabId = self.preparedViews.reduce((acc, view) => {
          if (self.timeline.pos > view.startPos && self.timeline.pos < view.startPos + view.duration) {
            return view.tab_id
          }
          return acc
        }, 0)
        return activeTabId
      }
    }
  })
  .actions(self => ({
    fetchTimeline: flow(function * () {
      console.log('fetching timeline for sessionId:', self.session.id)
      self.session = yield timeline(self.session.id)
      self.loading = false
    }),
    toggleFullscreen () {
      console.log('setting full screen from:', self.fullScreen)
      if (self.fullScreen) self.fullScreen = false
      else self.fullScreen = true
      // self.fullscreen = !self.fullscreen
    },
    setTime (time = 0) {
      self.time = time
    },
    setPlayerTime (time) {
      player.time = time
    },
    setPlayer (_player) {
      player = _player
      self.initPlayer()
    },
    initPlayer () {
      self.setTime(player.time)

      player.addListener(PLAYER_EVENTS.PLAYING_STATUS_CHANGE, (playingStatus) => {
        self.playing = playingStatus
      })

      // player.addListener('pause', () => {
      //   self.playing = false
      // })

      player.addListener(PLAYER_EVENTS.SPEED_CHANGE, (speed) => {
        // TODO: re introduce self
        // self.speed = speed
      })

      player.addListener(PLAYER_EVENTS.TIME_CHANGE, (time) => {
        self.setTime(time)
      })

      player.addListener(PLAYER_EVENTS.TAB_TITLE_CHANGE, (tabName) => {
        self.setTabName(tabName)
      })
    },
    setTabName ({id, name}) {
      console.log('setTabName name:', name, 'for id:', id)
      if (!self.tabName(id)) {
        self.tabNames.push({id: id, name: name})
      }
      console.log('tabNames:', self.tabNames)
    },
    togglePlaying () {
      if (!self.playing) {
        player.play()
      } else {
        player.pause()
      }
    },
    rewind (direction = 'forward') {
      const increment = (direction === 'forward' ? 1 : -1)
      const newSpeedIndex = (self.speedIndex + increment)
      const speedsLength = Object.keys(SPEEDS).length

      if (newSpeedIndex >= 0 && newSpeedIndex < speedsLength) {
        self.speedIndex = newSpeedIndex
        player.speed = self.speed
        player.play()
      }
    },
    setErrors (msg) {
      self.errors.push(msg)
    },
    setFadeInStatus (val) {
      self.fadingIn = val
    }
  }))

function prepareViews (session) {
  const {start: sessionStartDate, duration: sessionDuration, views: sessionViews} = session
  const rate = calcRate(sessionDuration)

  const preparedViews = sessionViews
    .map(view => ({
      id: view.id,
      tab_id: view.tab_id,
      startTime: calcStartTime(view.start, sessionStartDate),
      startPos: calcStartPos(view.start, sessionStartDate, rate),
      duration: calcDuration(view.duration, rate),
      url: view.url
    }))
    .sort((view1, view2) => view1.startPos - view2.startPos)

  return preparedViews
}

function calcRate (timelineDuration) {
  if (Number.isInteger(timelineDuration) && timelineDuration > 0) {
    return timelineDuration / 100
  } else {
    // this.setErrors('invalid timeline duration')
  }
}

function calcStartTime (viewStartTimeMs, timelineStartTimeMs) {
  if (isNumber(viewStartTimeMs) && isNumber(timelineStartTimeMs)) {
    return viewStartTimeMs - timelineStartTimeMs
  } else {
    // this.setErrors('invalid time ms format')
  }
}

function isNumber (value) {
  return typeof value === 'number'
}

function calcStartPos (viewStartTimeMs, timelineStartTimeMs, rate) {
  if (isNumber(viewStartTimeMs) && isNumber(timelineStartTimeMs) && isNumber(rate)) {
    return (viewStartTimeMs - timelineStartTimeMs) / rate
  } else {
    // this.setErrors('invalid time ms or rate format')
  }
}

function calcDuration (viewDuration, rate) {
  if (Number.isInteger(viewDuration) && isNumber(rate) && viewDuration > 0 && rate > 0) {
    return viewDuration / rate
  } else {
    // this.setErrors('invalid viewDuration or invalid rate')
  }
}

// export default SessionPlayer
const store = SessionPlayer.create({})
export default store
/* eslint-enable no-use-before-define */
