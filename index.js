const test = require('tape')
const { ConductorCluster } = require('./emulation')

const scenarioTest = async (numConductors = 2, dnaPath = './app_spec.dna.json', instanceId = 'app-spec') => {
  const cluster = new ConductorCluster(numConductors)
  await cluster.initialize()
  await cluster.batch(conductor => conductor.createDnaInstance(instanceId, dnaPath))

  // log all signals for all conductors
  cluster.batch((c, i) => c.onSignal(signal => console.log(`conductor${i} signal:`, JSON.stringify(signal))))

  console.log('before create_post')
  const postResult = await cluster.conductors[0].callZome(instanceId, 'blog', 'create_post')({
    content: 'hi',
    in_reply_to: null,
  })
  console.log('after create_post')
  const getPostInput = {
    post_address: JSON.parse(postResult).Ok
  }
  console.log('before get_post')
  const results = await cluster.batch(c => c.callZome(instanceId, 'blog', 'get_post')(getPostInput))
  console.log('after get_post')

  console.log('results', results)

  test('all nodes should be holding a copy now', function (t) {
      t.equal(1, 2)
      t.end()
  })
}

// first argument is the number of nodes to run
const optionalNumber = process.argv[2]

// second argument is a path to a DNA to run
const optionalDnaPath = process.argv[3]
scenarioTest(optionalNumber, optionalDnaPath)