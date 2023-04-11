import * as THREE from 'three'
import MusicPlayer from './MusicPlayer.js'

import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { CinematicCamera } from 'three/addons/cameras/CinematicCamera.js'

import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js'

const noise = new SimplexNoise()

const Utils = {
  fractionate: (val, minVal, maxVal) => {
    return (val - minVal) / (maxVal - minVal)
  },
  modulate: (val, minVal, maxVal, outMin, outMax) => {
    var fr = Utils.fractionate(val, minVal, maxVal)
    var delta = outMax - outMin
    return outMin + fr * delta
  },
  avg: arr => {
    var total = arr.reduce((sum, b) => {
      return sum + b
    })
    return total / arr.length
  },
  max: arr => {
    return arr.reduce((a, b) => {
      return Math.max(a, b)
    })
  }
}

export default class Scenario {
  constructor (container) {
    this.container = document.querySelector(container)

    this.config = {
      colors: {
        purple: 0x463190,
        magenta: 0xe62695,
        yellow: 0xfacf32,
        orange: 0xf99b1d,
        blue: 0x5edaa4
      },
      disco: {
        size: 800,
        length: 10,
        gap: 10,
        particlesCount: 3000
      },
      camera: {
        theta: 0,
        velocity: 0.1,
        radius: 100,
        focalLength: 15
      },
      lights: {
        theta: 0,
        velocity: 1,
        radius: 400
      },
      particles: {
        scale: 1,
        velocity: Math.PI / 180
      },
      bloomPass: {
        exposure: 0.7619,
        strength: 1.8,
        threshold: 0,
        radius: 0.57
      },
      afterimagePass: {
        value: 0.75
      },
      filmPass: {
        noiseIntensity: 0.8,
        scanlinesIntensity: 0.3,
        scanlinesCount: 256,
        grayscale: false
      }
    }
  }

  _createStats () {
    this.stats = new Stats()
    this.container.appendChild(this.stats.dom)
  }

  _createGUI () {
    this.gui = new GUI()

    const cameraControl = this.gui.addFolder('Camera')
    cameraControl.close()

    cameraControl
      .add(this.config.camera, 'velocity', 0, 1, 0.01)
      .onChange(value => {
        this.config.camera.velocity = value
      })

    cameraControl
      .add(this.config.camera, 'radius', 5, this.config.disco.size)
      .onChange(value => {
        this.config.camera.radius = value
      })

    cameraControl
      .add(this.config.camera, 'focalLength', 1, this.config.disco.size / 4)
      .onChange(value => {
        this.camera.setLens(value)
      })

    const bloomEffect = this.gui.addFolder('Bloom')
    bloomEffect.close()

    bloomEffect
      .add(this.config.bloomPass, 'threshold', 0.0, 1.0)
      .onChange(value => {
        this.bloomPass.threshold = Number(value)
      })

    bloomEffect
      .add(this.config.bloomPass, 'radius', 0.0, 1.0, 0.01)
      .onChange(value => {
        this.bloomPass.radius = Number(value)
      })

    const filmEffect = this.gui.addFolder('Film')
    filmEffect.close()

    filmEffect
      .add(this.config.filmPass, 'noiseIntensity', 0, 3)
      .onChange(value => {
        this.filmPass.uniforms.nIntensity.value = value
      })

    filmEffect
      .add(this.config.filmPass, 'scanlinesIntensity', 0, 1.0)
      .onChange(value => {
        this.filmPass.uniforms.sIntensity.value = value
      })

    filmEffect
      .add(this.config.filmPass, 'scanlinesCount', 0, 2048)
      .onChange(value => {
        this.filmPass.uniforms.sCount.value = value
      })

    filmEffect.add(this.config.filmPass, 'grayscale').onChange(value => {
      this.filmPass.uniforms.grayscale.value = value
    })
  }

  _createRenderer () {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    // this.renderer.toneMapping = THREE.ReinhardToneMapping
    // this.renderer.outputEncoding = THREE.sRGBEncoding
    this.container.appendChild(this.renderer.domElement)
  }

  _createScene () {
    this.scene = new THREE.Scene()
  }

  _createCamera () {
    this.camera = new CinematicCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      2000
    )
    this.camera.setLens(this.config.camera.focalLength)
    this.camera.position.set(0, 5, -200)
    // this.scene.add(this.camera)
  }

  _createControls () {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableZoom = true
  }

  _createLights () {
    this.pointLight1 = new THREE.PointLight(this.config.colors.magenta)
    this.scene.add(this.pointLight1)

    this.pointLight2 = new THREE.PointLight(this.config.colors.purple)
    this.scene.add(this.pointLight2)
  }

  _createCloud () {
    const [n, dri, r, dro] = [2000, 50, 75, 50]
    const pts = []

    for (let i = 0; i < n; i++) {
      const inout = (Math.random() - 0.5) * 2
      const lim = inout >= 0 ? dro : dri
      const rand = r + Math.pow(Math.random(), 3) * lim * inout

      const θ = Math.PI * 2 * Math.random()
      const φ = Math.acos(2 * Math.random() - 1)

      const ps = new THREE.Vector3(
        Math.cos(θ) * Math.sin(φ),
        Math.sin(θ) * Math.sin(φ),
        Math.cos(φ)
      )
      pts.push(ps.multiplyScalar(rand))
    }

    const cloudGeometry = new THREE.BufferGeometry().setFromPoints(pts)

    const material = new THREE.PointsMaterial({
      size: 1.5,
      color: 'white'
    })

    this.cloudPoints = new THREE.Points(cloudGeometry, material)
    this.scene.add(this.cloudPoints)
  }

  /**
   * Preloads music buffers
   * @param {MusicPlayer} musicPlayer - Music Player
   * */
  _createAudio (musicPlayer) {
    this.musicPlayer = musicPlayer
    this.samples = this.musicPlayer.samples

    const context = new AudioContext()

    const sample0 = context.createMediaElementSource(this.samples[0].element)
    const sample1 = context.createMediaElementSource(this.samples[1].element)
    const sample2 = context.createMediaElementSource(this.samples[2].element)
    const sample3 = context.createMediaElementSource(this.samples[3].element)

    this.audioAnalyser0 = context.createAnalyser()
    this.audioAnalyser1 = context.createAnalyser()
    this.audioAnalyser2 = context.createAnalyser()
    this.audioAnalyser3 = context.createAnalyser()

    sample0.connect(this.audioAnalyser0)
    sample1.connect(this.audioAnalyser1)
    sample2.connect(this.audioAnalyser2)
    sample3.connect(this.audioAnalyser3)

    this.audioAnalyser0.connect(context.destination)
    this.audioAnalyser1.connect(context.destination)
    this.audioAnalyser2.connect(context.destination)
    this.audioAnalyser3.connect(context.destination)

    this.audioAnalyser0.fftSize = 512
    this.audioAnalyser1.fftSize = 512
    this.audioAnalyser2.fftSize = 512
    this.audioAnalyser3.fftSize = 512

    this.audioArray0 = new Uint8Array(this.audioAnalyser0.frequencyBinCount)
    this.audioArray1 = new Uint8Array(this.audioAnalyser1.frequencyBinCount)
    this.audioArray2 = new Uint8Array(this.audioAnalyser2.frequencyBinCount)
    this.audioArray3 = new Uint8Array(this.audioAnalyser3.frequencyBinCount)
  }

  _createPostEffects () {
    this.renderScene = new RenderPass(this.scene, this.camera)

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    )
    this.bloomPass.threshold = this.config.bloomPass.threshold
    this.bloomPass.strength = this.config.bloomPass.strength
    this.bloomPass.radius = this.config.bloomPass.radius

    this.afterimagePass = new AfterimagePass()
    this.afterimagePass.uniforms.damp.value = this.config.afterimagePass.value

    this.filmPass = new FilmPass(1, 0.25, 1080, false)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(this.renderScene)
    this.composer.addPass(this.afterimagePass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(this.filmPass)
  }

  _createScenario () {
    // Inner planet
    this.innerPlanetObject = new THREE.Object3D()

    this.scene.add(this.innerPlanetObject)

    const innerPlanetGeometry = new THREE.IcosahedronGeometry(10, 1)

    const innerPlanetMaterial = new THREE.MeshPhysicalMaterial({
      color: this.config.colors.orange,
      metalness: 0.5,
      roughness: 0.5,
      side: THREE.DoubleSide,
      flatShading: true
    })

    const innerPlanetMesh = new THREE.Mesh(
      innerPlanetGeometry,
      innerPlanetMaterial
    )

    this.innerPlanetObject.add(innerPlanetMesh)

    // Outer planet

    this.outerPlanetObject = new THREE.Object3D()

    this.scene.add(this.outerPlanetObject)

    const outerPlanetGeometry = new THREE.IcosahedronGeometry(25, 2)

    const outerPlanetMaterial = new THREE.MeshLambertMaterial({
      color: this.config.colors.blue,
      wireframe: true,
      emissive: this.config.colors.blue,
      emissiveIntensity: 0.75
    })

    const nPos = []
    const vector = new THREE.Vector3()

    const position = outerPlanetGeometry.attributes.position

    for (let i = 0; i < position.count; i++) {
      vector.fromBufferAttribute(position, i).normalize()
      nPos.push(vector.clone())
    }

    outerPlanetGeometry.userData.nPos = nPos

    this.outerPlanetMesh = new THREE.Mesh(
      outerPlanetGeometry,
      outerPlanetMaterial
    )

    this.outerPlanetObject.add(this.outerPlanetMesh)

    this.insertFloors()
  }

  _onWindowResize () {
    const width = window.innerWidth
    const height = window.innerHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)
  }

  _onMusicControl (action) {
    this.musicPlayer[action]()
  }

  init (musicPlayer) {
    // this._createStats()
    this._createRenderer()
    this._createScene()
    this._createCamera()
    // this._createControls()
    this._createLights()
    this._createPostEffects()
    this._createGUI()
    this._createScenario()
    this._createCloud()
    this._createAudio(musicPlayer)

    this.renderer.setAnimationLoop(() => {
      this.animate()
    })
  }

  _animateCamera () {
    this.camera.position.set(
      this.config.camera.radius *
        Math.sin(THREE.MathUtils.degToRad(this.config.camera.theta)),
      this.config.camera.radius *
        Math.sin(THREE.MathUtils.degToRad(this.config.camera.theta)),
      this.config.camera.radius *
        Math.cos(THREE.MathUtils.degToRad(this.config.camera.theta))
    )
    this.camera.lookAt(this.scene.position)
    this.camera.updateMatrixWorld()
  }

  /**
   * [Animate a point light]
   * @param {THREE.PointLight} pointLight - THREE Point Light
   * @param {Number} radius - THREE Point Light Radius
   * */
  _animatePointLight (pointLight, radius) {
    pointLight.position.set(
      radius * Math.sin(THREE.MathUtils.degToRad(this.config.lights.theta)),
      radius * Math.sin(THREE.MathUtils.degToRad(this.config.lights.theta)),
      radius * Math.cos(THREE.MathUtils.degToRad(this.config.lights.theta))
    )
  }

  _animateOuterPlanet () {
    const mesh = this.outerPlanetMesh
    const { lowerMaxFr, upperAvgFr } = this.getFrequencies(
      this.audioAnalyser0,
      this.audioArray0
    )
    const bassFr = Utils.modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8)
    const treFr = Utils.modulate(upperAvgFr, 0, 1, 0, 8)

    const position = mesh.geometry.attributes.position

    const vector = new THREE.Vector3()

    mesh.geometry.userData.nPos.forEach((p, idx) => {
      vector.copy(p)
      vector.normalize()

      const offset = mesh.geometry.parameters.radius
      const amp = 10
      const time = window.performance.now()
      const rf = 0.00001

      const distance =
        offset +
        bassFr +
        noise.noise3D(
          vector.x + time * rf * 7,
          vector.y + time * rf * 8,
          vector.z + time * rf * 9
        ) *
          amp *
          treFr

      vector.multiplyScalar(distance)

      position.setXYZ(idx, vector.x, vector.y, vector.z)
    })

    mesh.geometry.computeVertexNormals()
    position.needsUpdate = true
  }

  _animateCloud () {
    const { overallAvg } = this.getFrequencies(
      this.audioAnalyser1,
      this.audioArray1
    )
    const scale = Utils.modulate(overallAvg, 0, 100, 1, 3)

    this.cloudPoints.scale.x = scale
    this.cloudPoints.scale.y = scale
    this.cloudPoints.scale.z = scale
  }

  _animateEffects () {
    const { lowerMaxFr, overallAvg } = this.getFrequencies(
      this.audioAnalyser2,
      this.audioArray2
    )
    const reducedLowerFr = Math.pow(lowerMaxFr, 0.8)

    const bass =
      reducedLowerFr < 0.3
        ? 0.75
        : Utils.modulate(reducedLowerFr, 0, 1, 0.42, 1.67)

    const treble = Utils.modulate(overallAvg, 10, 50, 0.5, 1)

    /* this.bloomPass.strength = Number(bass)
    this.config.bloomPass.strength = bass */

    this.afterimagePass.uniforms.damp.value = Number(treble)
    this.config.afterimagePass.value = treble
  }

  _animateLights () {
    const { overallAvg } = this.getFrequencies(
      this.audioAnalyser3,
      this.audioArray3
    )

    const lights = Utils.modulate(overallAvg, 0, 20, 0.5, 0)
    const bloom = Utils.modulate(overallAvg, 0, 20, 1.67, 0.42)

    this.pointLight1.intensity = lights
    this.pointLight2.intensity = lights

    this.bloomPass.strength = Number(bloom)
    this.config.bloomPass.strength = bloom

    const lightRadius = Utils.modulate(
      lights,
      0,
      1,
      this.config.lights.radius * 0.5,
      this.config.lights.radius
    )

    this._animatePointLight(this.pointLight1, lightRadius)
    this._animatePointLight(this.pointLight2, -lightRadius)
  }

  _animateMusic () {
    this._animateOuterPlanet()
    this._animateCloud()
    this._animateEffects()
    this._animateLights()
  }

  animate () {
    this.config.camera.theta += this.config.camera.velocity
    if (this.musicPlayer.isPlaying()) {
      this.config.lights.theta += this.config.lights.velocity
    }

    this._animateCamera()
    this._animateMusic()

    this.composer.render()

    this.stats?.update()
  }

  generateFloor ({ length = 0, size = 0, gap = 0 }) {
    const floors = new THREE.Group()

    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        const scale = (size - (length - 1) * gap) / length
        const [posX, posY] = [i * scale + gap * i, j * scale + gap * j]

        const planeObject = new THREE.Object3D()

        const planeGeometry = new THREE.PlaneGeometry(scale, scale)

        const planeMaterial = new THREE.MeshPhysicalMaterial({
          color: 0x555555,
          roughness: 0.5,
          metalness: 1,
          side: THREE.BackSide
        })

        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)

        planeObject.add(planeMesh)

        planeObject.position.set(posX + scale / 2, posY + scale / 2, 0)

        floors.add(planeObject)
      }
    }

    return floors
  }

  insertFloors () {
    const { size, length, gap } = this.config.disco

    // Bottom floor

    const bottomFloor = this.generateFloor({
      length,
      size,
      gap
    })

    bottomFloor.position.set(-size / 2, -size / 2, -size / 2)
    bottomFloor.rotateX(Math.PI / 2)

    this.scene.add(bottomFloor)

    // Top floor

    const topFloor = this.generateFloor({
      length,
      size,
      gap
    })

    topFloor.position.set(-size / 2, size / 2, -size / 2)
    topFloor.rotateX(-Math.PI / 2)
    topFloor.rotateZ(-Math.PI / 2)

    this.scene.add(topFloor)

    // Left floor

    const leftFloor = this.generateFloor({
      length,
      size,
      gap
    })

    leftFloor.position.set(size / 2, -size / 2, size / 2)
    leftFloor.rotateY(Math.PI / 2)

    this.scene.add(leftFloor)

    // Right floor

    const rightFloor = this.generateFloor({
      length,
      size,
      gap
    })

    rightFloor.position.set(-size / 2, -size / 2, -size / 2)
    rightFloor.rotateY(-Math.PI / 2)

    this.scene.add(rightFloor)

    // Front floor

    const frontFloor = this.generateFloor({
      length,
      size,
      gap
    })

    frontFloor.position.set(size / 2, -size / 2, -size / 2)
    frontFloor.rotateY(-Math.PI)

    this.scene.add(frontFloor)

    // Rear floor

    const rearFloor = this.generateFloor({
      length,
      size,
      gap
    })

    rearFloor.position.set(-size / 2, size / 2, size / 2)
    rearFloor.rotateZ(-Math.PI / 2)

    this.scene.add(rearFloor)
  }

  /**
   * [Update an basic]
   * @param {AnalyserNode} audioAnalyser - Web Audio Analyzer
   * @param {Uint8Array} audioArray - Audio frequencyBinCount
   * */
  getFrequencies (audioAnalyser, audioArray) {
    audioAnalyser.getByteFrequencyData(audioArray)

    const length = audioArray.length

    const lowerHalfArray = audioArray.slice(0, length / 2 - 1)
    const upperHalfArray = audioArray.slice(length / 2 - 1, length - 1)

    const overallAvg = Utils.avg(audioArray)
    const lowerMax = Utils.max(lowerHalfArray)
    const lowerAvg = Utils.avg(lowerHalfArray)
    const upperMax = Utils.max(upperHalfArray)
    const upperAvg = Utils.avg(upperHalfArray)

    const lowerMaxFr = lowerMax / lowerHalfArray.length
    const lowerAvgFr = lowerAvg / lowerHalfArray.length
    const upperMaxFr = upperMax / upperHalfArray.length
    const upperAvgFr = upperAvg / upperHalfArray.length

    return {
      overallAvg,
      lowerMaxFr,
      lowerAvgFr,
      upperMaxFr,
      upperAvgFr
    }
  }
}
