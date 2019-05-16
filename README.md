# emulation-testing

Make sure you run `npm install`

This code assumes an installed version of Holochain (`holochain` binary) available on the path

This code should be compatible as of now with the `develop` branch of [holochain-rust](https://github.com/holochain/holochain-rust).

Then, run `node emulation.js`

Optionally, you can give it an argument, with the number of Conductors to start, like:
```
node emulation.js 4
```

See some example simulation logs. P.s. I don't recommend running with 10 nodes on 1 device, unless it is has 32 or 64 GB of RAM and oodles of cores.
https://gist.github.com/Connoropolous/5b6b61922370fe378a1e7473918406cc