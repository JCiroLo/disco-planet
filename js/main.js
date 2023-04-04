import * as THREE from 'three'

var renderer
var scene
var camera
var composer
var object, circle, skelet, particle

window.onload = function () {
  init()
  animate()
}

function init () {
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.autoClear = false
  renderer.setClearColor(0x000000, 1)
  document.body.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 1, 1000)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1000
  )
  camera.position.z = 400
  scene.add(camera)

  object = new THREE.Object3D()
  circle = new THREE.Object3D()
  skelet = new THREE.Object3D()
  particle = new THREE.Object3D()

  scene.add(object)
  scene.add(circle)
  scene.add(skelet)
  scene.add(particle)

  var geometry = new THREE.TetrahedronGeometry(2, 0)
  var geometry7 = new THREE.TetrahedronGeometry(2, 2)
  var geom = new THREE.IcosahedronGeometry(7, 1)
  var geom2 = new THREE.IcosahedronGeometry(15, 2)

  var material = new THREE.MeshPhongMaterial({
    color: 0x353535,
    shading: THREE.FlatShading
  })

  var material7 = new THREE.MeshPhongMaterial({
    color: 0x111111,
    shading: THREE.FlatShading
  })

  for (var i = 0; i < 50; i++) {
    var mesh = new THREE.Mesh(geometry, material)
    mesh.position
      .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      .normalize()
    mesh.position.multiplyScalar(200 + Math.random() * 400)
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2)
    //mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 25;
    mesh.scale.x = mesh.scale.y = mesh.scale.z = 15
    object.add(mesh)
  }

  for (var i = 0; i < 1000; i++) {
    var mesh = new THREE.Mesh(geometry7, material7)
    mesh.position
      .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
      .normalize()
    mesh.position.multiplyScalar(90 + Math.random() * 700)
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2)
    //mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 25;
    particle.add(mesh)
  }

  var mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    //opacity: 0.35,
    //transparent: true,
    shading: THREE.FlatShading
  })

  var mat2 = new THREE.MeshPhongMaterial({
    color: 0x555555,
    wireframe: true,
    side: THREE.DoubleSide
  })

  var planet = new THREE.Mesh(geom, mat)
  planet.scale.x = planet.scale.y = planet.scale.z = 12
  circle.add(planet)

  var planet2 = new THREE.Mesh(geom2, mat2)
  planet2.scale.x = planet2.scale.y = planet2.scale.z = 8
  skelet.add(planet2)

  var ambientLight = new THREE.AmbientLight(0x353535)
  scene.add(ambientLight)

  var directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(1, 1, 1).normalize()
  scene.add(directionalLight)

  // var renderModel = new THREE.RenderPass(scene, camera);
  // composer = new THREE.EffectComposer(renderer);
  // composer.addPass(renderModel);

  // var rgbSplit = new THREE.ShaderPass(THREE.RGBShiftShader);
  // var tvSplit = new THREE.ShaderPass(THREE.BadTVShader);

  // rgbSplit.uniforms["amount"].value = 0;
  // tvSplit.uniforms["distortion"].value = 0;
  // tvSplit.uniforms["distortion2"].value = 0;

  // composer.addPass(rgbSplit);
  // composer.addPass(tvSplit);

  // tvSplit.renderToScreen = true;

  // rgbSplit.renderToScreen = true;

  // setInterval(anineIn, 7000);

  function anineIn () {
    rgbSplit.uniforms['amount'].value = 0.0075
    tvSplit.uniforms['distortion'].value = 7
    tvSplit.uniforms['distortion2'].value = 4
    setTimeout(anineOut, 700)
  }

  function anineOut () {
    rgbSplit.uniforms['amount'].value = 0
    tvSplit.uniforms['distortion'].value = 0
    tvSplit.uniforms['distortion2'].value = 0
  }

  window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  //composer.setSize(window.innerWidth, window.innerHeight);
}

function animate () {
  requestAnimationFrame(animate)

  object.rotation.x += 0.003
  object.rotation.y += 0.003
  particle.rotation.x += 0.0
  particle.rotation.y -= 0.004
  circle.rotation.x -= 0.002
  circle.rotation.y -= 0.002
  skelet.rotation.x -= 0.001
  skelet.rotation.y += 0.001
  renderer.clear()

  renderer.render(scene, camera)
  //composer.render();
}
