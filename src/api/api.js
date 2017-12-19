
const api = {
  cache: {},
  pending: {},
  api: undefined,

  init (api) {
    this.api = api
  },

  timeline (sessionId) {
    console.log('about to fetch sessionId:', sessionId)
    const id = sessionId
    // TODO: change syntax to /sessionplayer/sessions/{sessionId}/timeline
    const url = '/sessionplayer/' + sessionId

    return this._getData(id, url)
  },

  _getData (id, url) {
    if (this.cache[id]) {
      return Promise.resolve(this.cache[id])
    } else if (this.pending[id]) {
      return this.pending[id]
    } else {
      const resPromise = new Promise(resolve => {
        this.api.get(url, resolve)
      })
      this.pending[id] = resPromise

      resPromise.then(res => {
        if (!this.cache[id]) {
          this.cache[id] = res
          this.pending[id] = false
        }
      })
      return resPromise
    }
  },

  events (sessionId, viewId, from, duration) {
    const id = sessionId + viewId
    // TODO: change syntax to /sessionplayer/sessions/{sessionId}/views/{viewId}
    const url = '/sessionplayer/' + sessionId + '/' + viewId + '?from=' + from + '&duration=' + duration

    return this._getData(id, url)
  }
}

export let init = api.init.bind(api)
export let timeline = api.timeline.bind(api)
export let events = api.events.bind(api)

export default api
