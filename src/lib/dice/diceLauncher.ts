/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as THREE from 'three'
import CANNON from "cannon"
import {
  DiceD10,
  DiceD12,
  DiceD20,
  DiceD4,
  DiceD6,
  DiceD8,
  DiceManager,
  DiceObject,
} from "@/lib/dice/diceEngine"

export type DiceType = keyof typeof DiceLauncher.diceTypes

export class DiceLauncher {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  dices: DiceObject[]
  world: CANNON.World
  el: HTMLDivElement

  constructor(el: HTMLDivElement) {
    this.el = el
    this.dices = []
    const SCREEN_WIDTH = el.clientWidth || el.offsetWidth || 320
    const SCREEN_HEIGHT = el.clientHeight || el.offsetHeight || 320
    const VIEW_ANGLE = 25
    const ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT
    const NEAR = 0.01
    const FAR = 20000
    const RUG = 10

    // Scene
    const scene = (this.scene = new THREE.Scene())

    // Camera
    const camera = (this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR))
    scene.add(camera)
    camera.position.set(0, 25, 0)
    camera.rotation.set(-Math.PI / 2, 0, 0)

    // Renderer
    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true }))
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT)
    renderer.setAnimationLoop(this.animation.bind(this))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const canvas = renderer.domElement
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    el.appendChild(canvas)

    // Light
    const ambient = new THREE.AmbientLight('#ffffff', 1)
    scene.add(ambient)

    // FLOOR
    const floorMaterial = new THREE.MeshPhongMaterial({ color: '#facc15', side: THREE.DoubleSide })
    const floorGeometry = new THREE.PlaneGeometry(RUG, RUG, 10, 10)
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.receiveShadow = true
    floor.rotation.x = Math.PI / 2
    scene.add(floor)

    // World
    const world = (this.world = new CANNON.World())

    world.gravity.set(0, -9.82 * 5, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 16

    DiceManager.setWorld(world)

    // Floor
    const floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: DiceManager.floorBodyMaterial,
    })
    // floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    world.addBody(floorBody)

    // Wall
    function addWall(opts: {
      rotationY: number
      rotationX: number
      positionX: number
      positionY: number
      positionZ: number
      euler: [number, number, number]
    }) {
      const wallMaterial = new THREE.MeshPhongMaterial({ color: '#facc15', side: THREE.DoubleSide })
      const wallGeometry = new THREE.PlaneGeometry(RUG, RUG, 10, 10)
      const wall = new THREE.Mesh(wallGeometry, wallMaterial)
      wall.rotation.y = opts.rotationY
      wall.rotation.x = opts.rotationX
      wall.position.x = opts.positionX
      wall.position.y = opts.positionY
      wall.position.z = opts.positionZ
      scene.add(wall)

      // Wall barrier
      const barrierBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: DiceManager.barrierBodyMaterial,
      })
      barrierBody.quaternion.setFromEuler(...opts.euler)
      barrierBody.position.set(wall.position.x, wall.position.y, wall.position.z)
      world.addBody(barrierBody)
    }

    addWall({
      rotationY: Math.PI / 2,
      rotationX: 0,
      positionX: RUG / 2,
      positionY: RUG / 2,
      positionZ: 0,
      euler: [0, -Math.PI / 2, 0],
    })

    addWall({
      rotationY: Math.PI / 2,
      rotationX: 0,
      positionX: -RUG / 2,
      positionY: RUG / 2,
      positionZ: 0,
      euler: [0, Math.PI / 2, 0],
    })

    addWall({
      rotationY: Math.PI,
      rotationX: 0,
      positionX: 0,
      positionY: RUG / 2,
      positionZ: RUG / 2,
      euler: [0, Math.PI, 0],
    })

    addWall({
      rotationY: Math.PI,
      rotationX: 0,
      positionX: 0,
      positionY: RUG / 2,
      positionZ: -RUG / 2,
      euler: [0, 0, 0],
    })
  }

  lastTime = 0
  animation(time: number) {
    if (this.lastTime === 0) {
      this.lastTime = time
      this.renderer.render(this.scene, this.camera)
      return
    }

    const dt = Math.min((time - this.lastTime) / 1000, 0.05)
    this.lastTime = time
    this.world.step(dt)
    for (const i in this.dices) {
      this.dices[i].updateMeshFromBody()
    }
    this.renderer.render(this.scene, this.camera)
  }

  static diceTypes = {
    4: DiceD4,
    6: DiceD6,
    8: DiceD8,
    10: DiceD10,
    12: DiceD12,
    20: DiceD20,
  }
  diceType: DiceType = 6
  diceNum = 0
  #setDices(type: DiceType, num: number) {
    if (this.diceType === type && this.diceNum === num) return
    this.diceType = type
    this.diceNum = num
    this.clearDices()
    for (let i = 0; i < num; i++) {
      const dice = new DiceLauncher.diceTypes[type]({
        size: 1.5,
        fontColor: '#facc15',
        backColor: '#0f0e17',
      })
      this.scene.add(dice.getObject())
      this.dices.push(dice)
    }
  }

  clearDices() {
    for (const dice of this.dices) {
      this.world.remove(dice.getObject().body)
      this.scene.remove(dice.getObject())
    }
    this.dices = []
  }

  throw(diceType: DiceType, num: number) {
    this.#setDices(diceType, num)
    for (let i = 0; i < this.dices.length; i++) {
      const dice = this.dices[i]
      const obj = dice.getObject()

      // Reset
      dice.resetBody()

      // Position
      obj.position.x = (i % 3) * 1.5
      obj.position.y = 10 + Math.floor(i / 3) * 1.5
      obj.position.z = (i % 3) * 1.5

      // Rotation
      obj.quaternion.x = ((Math.random() * 90 - 45) * Math.PI) / 180
      obj.quaternion.z = ((Math.random() * 90 - 45) * Math.PI) / 180

      // Update mesh
      dice.updateBodyFromMesh()

      // Velocity
      const rand = () => (Math.random() - 0.5) * 20
      obj.body.velocity.set(rand() * 2, rand(), rand() * 2)

      // Angular velocity
      obj.body.angularVelocity.set(
        60 * (Math.random() - 0.5),
        60 * (Math.random() - 0.5),
        60 * (Math.random() - 0.5)
      )
    }
  }

  dispose() {
    this.clearDices()
    this.renderer.dispose()
    this.el.innerHTML = ''
    // @ts-ignore
    this.world = null
    // @ts-ignore
    this.scene = null
    // @ts-ignore
    this.camera = null
    // @ts-ignore
    this.renderer = null
  }
}
