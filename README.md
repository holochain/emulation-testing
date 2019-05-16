# simulation-testing

Make sure you run `npm install`

This code assumes an installed version of Holochain (`holochain` binary) available on the path

This code should be compatible as of now with the `develop` branch of [holochain-rust](https://github.com/holochain/holochain-rust).

Then, run `node simulation.js`

Optionally, you can give it an argument, with the number of Conductors to start, like:
```
node simulation.js 4
```

See some example simulation logs. P.s. I don't recommend running with 10 nodes on 1 device, unless it is has 32 or 64 GB of RAM and oodles of cores.
https://gist.github.com/Connoropolous/5b6b61922370fe378a1e7473918406cc

## Current Status: Zome error in App Spec

We are currently blocked.

We are wondering why we are seeing the following back from our call to `create_post` of the `app_spec` DNA: 

thread '<unnamed>' panicked at 'Failed to instantiate module: Function("host module doesn\'t export function with name hc_grant_capability"

We believe this is due to a mismatch between the version app_spec.dna.json was packaged on, and the version its being run on. 