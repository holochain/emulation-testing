const child_process = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Config = require('./config')

const genConfig = (index, tmpPath) => {

  const adminPort = 3000 + index
  const instancePort = 4000 + index

  const config = `
agents = []
dnas = []
instances = []

[[interfaces]]
admin = true
id = "${Config.adminInterfaceId}"
instances = []
    [interfaces.driver]
    type = "websocket"
    port = ${adminPort}

[[interfaces]]
admin = true
id = "${Config.dnaInterfaceId}"
instances = []
    [interfaces.driver]
    type = "websocket"
    port = ${instancePort}

[logger]
type = "debug"

[network]
n3h_log_level = "i"
bootstrap_nodes = []
n3h_persistence_path = "${tmpPath}"
    `

  return { config, adminPort, instancePort }
}



const spawnConductor = i => {
  const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'n3h-test-conductors-'))
  const n3hPath = path.join(tmpPath, 'n3h-storage')
  fs.mkdirSync(n3hPath)
  const configPath = path.join(tmpPath, `empty-conductor-${i}.toml`)

  const { config, adminPort, instancePort } = genConfig(i, n3hPath)

  fs.writeFileSync(configPath, config)

  console.info(`Spawning conductor${i} process...`)

  const handle = child_process.spawn(`holochain`, ['-c', configPath])

  handle.stdout.on('data', data => console.log(`[C${i}]`, data.toString('utf8')))
  handle.stderr.on('data', data => console.error(`!C${i}!`, data.toString('utf8')))
  handle.on('close', code => console.log(`conductor ${i} exited with code`, code))

  console.info(`Conductor${i} process spawning successful`)

  return new Promise((resolve) => {
    handle.stdout.on('data', data => {
      // wait for the logs to convey that the interfaces have started
      // because the consumer of this function needs those interfaces
      // to be started so that it can initiate, and form,
      // the websocket connections
      if (data.toString('utf8').indexOf('Starting interfaces...') >= 0) {
        resolve({
          adminPort,
          instancePort,
          handle
        })
      }
    })
  })
}


const spawnConductors = async (numberOfConductors) => {
  const promises = []

  // start the first conductor and
  // wait for it, because it sets up n3h
  const firstConductor = await startConductor(0)
  promises.push(firstConductor)

  for (let i = 1; i < numberOfConductors; i++) {
    promises.push(startConductor(i))
  }
  return Promise.all(promises)
}
module.exports.spawnConductors = spawnConductors
