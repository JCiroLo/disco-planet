import Scenario from './Scenario.js'
import MusicPlayer from './MusicPlayer.js'

window.addEventListener('load', () => {
  const musicPlayer = new MusicPlayer()

  const app = new Scenario('#app')
  app.init(musicPlayer)

  const playButton = document.getElementById('play')
  playButton.addEventListener('click', () => app._onMusicControl('play'))

  const pauseButton = document.getElementById('pause')
  pauseButton.addEventListener('click', () => app._onMusicControl('pause'))

  const stopButton = document.getElementById('stop')
  stopButton.addEventListener('click', () => app._onMusicControl('stop'))

  const sample0Button = document.getElementById('sample0')
  sample0Button.addEventListener('click', () => app.musicPlayer.muteSample(0))

  const sample1Button = document.getElementById('sample1')
  sample1Button.addEventListener('click', () => app.musicPlayer.muteSample(1))

  const sample2Button = document.getElementById('sample2')
  sample2Button.addEventListener('click', () => app.musicPlayer.muteSample(2))

  const sample3Button = document.getElementById('sample3')
  sample3Button.addEventListener('click', () => app.musicPlayer.muteSample(3))

  window.addEventListener('resize', () => app._onWindowResize())
})
