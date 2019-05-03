const { main } = require('./index')
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
      let count = 0
      const areWeDoneYet = () => {
        if (++count === 2) {
          resolve()
        }
      }

      connect(`ws://localhost:${this.adminPort}`).then(async ({ call, close, ws }) => {

        console.log('we connected to admin socket')
        this.callAdmin = call
        this.adminWs = ws
        const result = await this.createAgent()
        console.log('create agent result: ', result)
        areWeDoneYet()
      }).catch(reject)

      connect(`ws://localhost:${this.instancePort}`).then(({ callZome, close, ws }) => {
        this.callZome = callZome
        this.instanceWs = ws
        areWeDoneYet()
      }).catch(reject)
    })
  }

  createAgent() {

    ///  * `admin/agent/add`
    ///     Add an agent to the conductor configuration that can be used with instances.
    ///     Params:
    ///     * `id`: Handle of this agent configuration as used in the config / other function calls
    ///     * `name`: Nickname of this agent configuration
    ///     * `holo_remote_key`: [Option<String>] Create this agent from an existing keypair generated externally. Public key is passed as param.
    ///         All signing calls will be redirected externally via the wormhole websocket.
    ///         If this param is not provided the key generation will be handled by the conductor and signing done internally.
    ///     * `passphrase`: [Option<String>] A clear text passphrase with which to encrypt the key_store.
    ///         This prevents the running conductor from prompting for a password.
    ///         For test agents only. NOT SECURE!
    ///     Returns the agent public key

    return this.callAdmin('admin/agent/add')({ id: this.agentId, name: this.agentName, passphrase: "eh?" })
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
    this.instanceWs.socket.on('message', fn) 
  }

  shutdown() {
    this.handle.kill()
  }
}

class ConductorCluster {
  constructor(numConductors) {
    const conductorsArray = main(numConductors)
    this.conductors = conductorsArray.map(conductorInfo => new ConductorHandle(conductorInfo))
  }

  initialize() {
    return Promise.all(this.conductors.map(conductor => conductor.initialize()))
  }

  batch(fn) {
    return Promise.all(this.conductors.map(fn))
  }

  shutdown() {

  }
}

const actualConsumerTestCode = async () => {
  const numConductors = 5
  const dnaPath = './app_spec.dna.json'
  const instanceId = 'app-spec'
  const cluster = new ConductorCluster(numConductors)

  await cluster.initialize()
  await cluster.batch(conductor => conductor.createDnaInstance(instanceId, dnaPath))

  const conductor0 = cluster.conductors[0]

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
  conductor0.onSignal((rawMessage) => {
    const msg = JSON.parse(rawMessage)
    const isInternal = msg.signal && msg.signal.signal_type === 'Internal'
    if (isInternal) {
      const {action} = msg.signal
      console.log("got internal signal:", action)
    }
  })

  await conductor0.callZome(instanceId, 'blog', 'create_post')({
    content: 'hi'
  })

  
  // const results = await cluster.batch(c => c.callZome(instanceId, 'blog', 'get_posts')({}))
  

  console.log('done')

  // t.ok(results.every(result => result.Ok.items.length === num))
}

try {
  actualConsumerTestCode().catch(e => {
    console.error("actual consumer test rejected!")
    console.error(e)
  })
} catch (e) {
  console.error("actual consumer test failed!")
  console.error(e)
}
