import Sample from './Sample.js'

export default class MusicPlayer {
  constructor () {
    this.samples = [
      new Sample('./audio/sample0.mp3'),
      new Sample('./audio/sample1.mp3'),
      new Sample('./audio/sample2.mp3'),
      new Sample('./audio/sample3.mp3')
    ]
    this.status = false
  }

  play () {
    this.status = true
    this.samples.forEach(sample => sample.play())
  }

  pause () {
    this.status = false
    this.samples.forEach(sample => sample.pause())
  }

  stop () {
    this.status = false
    this.samples.forEach(sample => sample.stop())
  }

  muteSample (position) {
    if (this.samples[position].getVolume() === 0) {
      this.samples[position].setVolume(1)
    } else {
      this.samples[position].setVolume(0)
    }
  }

  getDuration () {
    return this.samples.reduce((prev, curr) =>
      Math.max(prev, curr.getDuration())
    )
  }

  isPlaying () {
    return this.status
  }
}
