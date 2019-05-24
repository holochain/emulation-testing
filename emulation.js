const { spawnConductors } = require('./spawn_conductors')
const Config = require('./config')
const { connect } = require('@holochain/hc-web-client')
const kill = require('tree-kill')

class ConductorHandle {
  constructor({ adminPort, instancePort, handle }) {
    this.adminPort = adminPort
    this.instancePort = instancePort
    this.handle = handle

    this.agentId = `agent-${this.instancePort}`
    this.agentName = `Agent${this.instancePort}`

    this.adminWs = null
    this.instanceWs = null
  }

  initialize() {
    return new Promise((resolve, reject) => {
      console.info("Starting initialization...")

      Promise.all([
        connect(`ws://localhost:${this.adminPort}`).then(async ({ call, close, ws }) => {
          console.log('connection opened to admin websocket')
          this.callAdmin = call
          this.adminWs = ws
          console.info("Creating agent...")
          const result = await this.createAgent()
          console.log('create agent result: ', result)
        }),
        connect(`ws://localhost:${this.instancePort}`).then(({ callZome, close, ws }) => {
          console.log('connection opened to instance websocket')
          this.callZome = callZome
          this.instanceWs = ws
        })
      ]).then(resolve).catch(reject)
    })
  }

  createAgent() {
    return this.callAdmin('test/agent/add')({ id: this.agentId, name: this.agentName })
  }

  async createDnaInstance(instanceId, dnaPath) {
    const dnaId = 'dna' + instanceId
    await this.callAdmin('admin/dna/install_from_file')({
      id: dnaId,
      path: dnaPath,
    })
    const instanceInfo = {
      id: instanceId,
      agent_id: this.agentId,
      dna_id: dnaId,
    }
    await this.callAdmin('admin/instance/add')(instanceInfo)
    await this.callAdmin('admin/instance/start')(instanceInfo)

    // we know that calling add_instance is going to trigger
    // a websocket shutdown and reconnect, so we don't want to consider
    // this function call complete until we have the reconnection
    const promise = new Promise(resolve => this.instanceWs.once('open', resolve))
    this.callAdmin('admin/interface/add_instance')({
      interface_id: Config.dnaInterfaceId,
      instance_id: instanceId,
    })
    return promise
  }

  onSignal(fn) {
    this.instanceWs.socket.on('message', rawMessage => {
      const msg = JSON.parse(rawMessage)
      const isTrace = msg.signal && msg.signal.signal_type === 'Trace'
      if (isTrace) {
        const { action } = msg.signal
        fn(action)
      }
    })
  }

  shutdown() {
    return new Promise((resolve, reject) => {
      kill(this.handle.pid, resolve)
    })
  }
}
module.exports.ConductorHandle = ConductorHandle

class ConductorCluster {
  constructor(numConductors, options = { debugging: false }) {
    this.numConductors = numConductors
    this.options = options
  }

  async initialize() {
    const conductorsArray = await spawnConductors(this.numConductors, this.options.debugging)
    console.log('spawnConductors completed')
    this.conductors = conductorsArray.map(conductorInfo => new ConductorHandle(conductorInfo))
    return Promise.all(this.conductors.map(conductor => conductor.initialize()))
  }

  batch(fn) {
    return Promise.all(this.conductors.map(fn))
  }

  shutdown() {
    return this.batch(c => c.shutdown())
  }
}
module.exports.ConductorCluster = ConductorCluster