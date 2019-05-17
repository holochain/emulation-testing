const test = require('tape')
const { ConductorCluster } = require('./emulation')

const scenarioTest = async (numConductors = 2, dnaPath = './app_spec.dna.json', instanceId = 'app-spec') => {
  const cluster = new ConductorCluster(numConductors)
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
  if (!results.every(res => JSON.parse(res).Ok)) {
    process.exit(1)
  } else {
    process.exit()
  }
}

// first argument is the number of nodes to run
const optionalNumber = process.argv[2]

// second argument is a path to a DNA to run
const optionalDnaPath = process.argv[3]
scenarioTest(optionalNumber, optionalDnaPath)