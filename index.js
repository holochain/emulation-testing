const test = require('tape')
const { ConductorCluster } = require('./emulation')

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error.message);
})

const scenarioTest = async (numConductors = 2, debugging = false, dnaPath = './app_spec.dna.json', instanceId = 'test-1') => {
  const cluster = new ConductorCluster(numConductors, { debugging })
  await cluster.initialize()
  await cluster.batch(conductor => conductor.createDnaInstance(instanceId, dnaPath))

  // log all signals for all conductors
  // cluster.batch((c, i) => c.onSignal(signal => console.log(`conductor${i} signal:`, JSON.stringify(signal))))

  const postResult = await cluster.conductors[0].callZome(instanceId, 'blog', 'create_post')({
    content: 'hi',
    in_reply_to: null,
  })
  const getPostInput = {
    post_address: JSON.parse(postResult).Ok
  }
  const results = await cluster.batch(c => c.callZome(instanceId, 'blog', 'get_post')(getPostInput))

  console.log('results', results)
  await cluster.shutdown()

  if (!results.every(res => JSON.parse(res).Ok)) {
    process.exit(1)
  } else {
    process.exit()
  }
}

// first argument is the number of nodes to run
const optionalNumber = process.argv[2]

// third argument is
const optionalDebugging = process.argv[3]

// third argument is a path to a DNA to run
const optionalDnaPath = process.argv[4]

scenarioTest(optionalNumber, optionalDebugging, optionalDnaPath)