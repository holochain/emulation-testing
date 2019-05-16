const { spawnConductors } = require('./index')
const Config = require('./config')
const { connect } = require('@holochain/hc-web-client')

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
      const isInternal = msg.signal && msg.signal.signal_type === 'Internal'
      if (isInternal) {
        const {action} = msg.signal
        fn(action)
      }
    })
  }

  shutdown() {
    this.handle.kill()
  }
}

class ConductorCluster {
  constructor(numConductors) {
    this.numConductors = numConductors
  }

  async initialize() {
    const conductorsArray = await spawnConductors(this.numConductors)
    console.log('spawnConductors completed')
    this.conductors = conductorsArray.map(conductorInfo => new ConductorHandle(conductorInfo))
    return Promise.all(this.conductors.map(conductor => conductor.initialize()))
  }

  batch(fn) {
    return Promise.all(this.conductors.map(fn))
  }

  shutdown() {

  }
}

const actualConsumerTestCode = async (numConductors = 2, dnaPath = './app_spec.dna.json', instanceId = 'app-spec') => {
  const cluster = new ConductorCluster(numConductors)

  await cluster.initialize()

  console.log('initialized')

  await cluster.batch(conductor => conductor.createDnaInstance(instanceId, dnaPath))

  console.log('created DNA instances')

  // log all signals for all conductors
  cluster.batch((c, i) => c.onSignal(signal => console.log(`conductor${i} signal:`, JSON.stringify(signal))))

  await cluster.conductors[0].callZome(instanceId, 'blog', 'create_post')({
    content: 'hi',
    in_reply_to: null,
  })

  
  // const results = await cluster.batch(c => c.callZome(instanceId, 'blog', 'get_posts')({}))
  

  console.log('done')

  // t.ok(results.every(result => result.Ok.items.length === num))
}

const optionalNumber = process.argv[2]
const optionalDnaPath = process.argv[3]
try {
  actualConsumerTestCode(optionalNumber, optionalDnaPath).catch(e => {
    console.error("actual consumer test rejected!")
    console.error(e)
  })
} catch (e) {
  console.error("actual consumer test failed!")
  console.error(e)
}


// {
//   "signal": {
//     "signal_type": "Internal",
//     "action": {
//       "action_type": "SignalZomeFunctionCall",
//       "data": {
//         "id": {
//           "prefix": 6,
//           "offset": 1
//         },
//         "zome_name": "blog",
//         "cap": {
//           "cap_token": "QmNgk3cWLXhTSkJw4Gh4up5kHt2o1hvJ8ypH2J34eF5ahe",
//           "provenance": [
//             "HcScinEyDXGmq6cwaqg9Q794tMtobRs5jRoZxenj8kexawjgEq4YVV8RbThcqnr",
//             "Gq2Q/vbV7PIGb3oH/UEjBCWkzbOCfJuWzQDssq+0TZnZ+Vf5+FvYk7Qs4jVqlVf1rUSYKzWjgVAH7aU1NqVcAw=="
//           ]
//         },
//         "fn_name": "create_post",
//         "parameters": "{\"content\":\"hi\"}"
//       }
//     },
//     "id": {
//       "prefix": 6,
//       "offset": 2
//     }
//   },
//   "instance_id": "app-spec"
// }
