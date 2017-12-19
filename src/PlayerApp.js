import React from 'react'
import store from './store/playerStore'
import { observer } from 'mobx-react'
import restApi from './api/mock-restApi'
import {init} from './api/api'
import Player from './player/mock-player'

init(restApi)
// const store = SessionPlayer.create({})
store.setPlayer(new Player({duration: 23328}))
store.session.setVisitId('3CAFA8632EC1322195AAB891F4765808D13CCE14')

const App = observer((props) => {
  function nextView () {
    const preparedViews = store.preparedViews
    const nextView = preparedViews.find(view => view.startTime > store.time)

    if (nextView) {
      console.log('setting player.time to', nextView.startTime)
      store.setPlayerTime(nextView.startTime)
    }
  }

  function prevView () {
    const prevView = store.preparedViews.slice(0).reverse().find(view => view.startTime < store.time - 1000)
    if (prevView) store.setPlayerTime(prevView.startTime)
  }

  function emitTimeChange (pos) {
    const time = Math.round(pos / 100 * store.session.duration)
    // TODO: should not use the player directly
    console.log('setting player time to', time)
    store.setPlayerTime(time)
  }

  return (<div>
    Player app started !!
    <button onClick={store.fetchTimeline}>Load session</button>
    <button onClick={store.togglePlaying}>Play session</button>
    <button onClick={() => store.rewind('forward')}>Increase speed</button>
    <button onClick={() => store.rewind('backward')}>Decrease speed</button>
    <button onClick={nextView}>Next view</button>
    <button onClick={prevView}>Prev view</button>
    <button onClick={() => emitTimeChange(10.91)}>Jump to some pos</button>
    <button onClick={store.toggleFullscreen}>Full screen</button>
    <div style={{border: 'thin solid black'}}>
      <strong> loading:</strong> {JSON.stringify(store.loading)}</div>
    <div style={{border: 'thin solid black'}}>
      <strong>Session data:</strong> {JSON.stringify(store.session)}</div>
    <div style={{border: 'thin solid black'}}>
      <strong>Timeline:</strong> {JSON.stringify(store.preparedViews)}</div>
    <div style={{border: 'thin solid black'}}>
      <strong>Tabs:</strong> {JSON.stringify(store.tabs)}</div>
    <div style={{border: 'thin solid black'}}>
      <strong>Full Screen:</strong> {JSON.stringify(store.fullScreen)}
      <strong>Playing:</strong> {JSON.stringify(store.playing)}
      <strong>Speed:</strong> {JSON.stringify(store.speed)}
      <strong>Time:</strong> {JSON.stringify(store.time)}
      <strong>Pos:</strong> {JSON.stringify(store.timeline.pos)}
      <strong>Active view:</strong> {JSON.stringify(store.activeViewId)}
      <strong>Active tab:</strong> {JSON.stringify(store.activeTabId)}
      <strong>Tab names:</strong> {JSON.stringify(store.tabNames)}
    </div>
  </div>)
})

export default App
