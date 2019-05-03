const shell = require('shelljs')
const fs = require('fs')
const os = require('os')
const path = require('path')
const Config = require('./config')

const genConfig = (index) => {

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
    `

    // [network]
    // bootstrap_nodes = []

  return { config, adminPort, instancePort }
}



const main = (numberOfConductors) => {
  const conductors = []
  for (let i = 0; i < numberOfConductors; i++) {
    const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'n3h-test-conductors-'))
    fs.mkdirSync(tmpPath, {recursive: true})
    const configPath = path.join(tmpPath, `empty-conductor-${i}.toml`)

    const {config, adminPort, instancePort} = genConfig(i)

    fs.writeFileSync(configPath, config)

    conductors.push({
      adminPort,
      instancePort,
      handle: shell.exec(`holochain -c ${configPath}`, { async: true })
    })
  }
  return conductors
}
module.exports.main = main
