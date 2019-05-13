const child_process = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Config = require('./config')

const genConfig = (index, tmpPath) => {

  const adminPort = 3000 + index
  const instancePort = 4000 + index

  const config =  `
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



const spawnConductors = (numberOfConductors) => new Promise(resolve => {
  const conductors = []
  let starts = 0
  for (let i = 0; i < numberOfConductors; i++) {
    const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'n3h-test-conductors-'))
    // const tmpPath = (path.join(os.tmpdir(), 'debug'))
    const n3hPath = path.join(tmpPath, 'n3h-storage')
    fs.mkdirSync(n3hPath, {recursive: true})
    const configPath = path.join(tmpPath, `empty-conductor-${i}.toml`)

    const {config, adminPort, instancePort} = genConfig(i, n3hPath)

    fs.writeFileSync(configPath, config)

    console.info("Spawning conductor processes...")

    const handle = child_process.spawn(`holochain`, ['-c', configPath])

    handle.stdout.on('data', data => {
      const line = data.toString('utf8')
      console.log(`[C${i}]`, line)
      // wait for the logs to convey that the interfaces have started
      // because the consumer of this function needs those interfaces
      // to be started so that it can initiate, and form,
      // the websocket connections
      if (line.indexOf('Starting interfaces...') >= 0) {
        starts += 1
        if (starts === numberOfConductors) {
          resolve(conductors)
        }
      }
    })
    handle.stderr.on('data', data => console.error(`!C${i}!`, data.toString('utf8')))
    handle.on('close', code => console.log(`conductor ${i} exited with code`, code))

    console.info("Conductor process spawning successful")

    conductors.push({
      adminPort,
      instancePort,
      handle
    })
  }
})
module.exports.spawnConductors = spawnConductors
