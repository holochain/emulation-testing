# simulation-testing

Make sure you run `npm install`

This code assumes an installed version of Holochain (`holochain` binary) available on the path

The version of Holochain that will currently work with everything here, is the branch [rust-conductor-testing](https://github.com/holochain/holochain-rust/pull/1334) of holochain-rust

Then, run `node simulation.js`

Optionally, you can give it an argument, with the number of Conductors to start, like:
```
node simulation.js 4
```

See some example simulation logs. P.s. I don't recommend running with 10 nodes on 1 device, unless it is has 32 or 64 GB of RAM and oodles of cores.
https://gist.github.com/Connoropolous/5b6b61922370fe378a1e7473918406cc

## Current Status: Zome error in App Spec

We are currently blocked.

We are wondering why we are getting the following back from our call to `create_post` of the `app_spec` DNA: `Signature of entry QmWY98zemN4Mi9A9SgmC8vQufaQUf5a13Xe81PfWDvvnn9 from author HcSCIvEzcZubrc3bcazGppc4Ep9Jbattn8m9V3MzPfzTon9g3QXPZQIBGquqqar invalid`

```json
{
  "action_type": "ReturnZomeFunctionResult",
  "data": {
    "call": {
      "id": {
        "prefix": 4,
        "offset": 1
      },
      "zome_name": "blog",
      "cap": {
        "cap_token": "QmNgk3cWLXhTSkJw4Gh4up5kHt2o1hvJ8ypH2J34eF5ahe",
        "provenance": [
          "HcScj56HdRyy8Z3oegB5NeP76XzThf3xqFwDM6xODOyxoyj5EgcD7X3zume9wba",
          "T5ynxOqk/HNeJguAthKuA2AveJS+uC8nU+HXYTHsZsP15p6v2RUqUMym/EhuL+1ZvPqgvuFL0chg67IAOo38Cg=="
        ]
      },
      "fn_name": "create_post",
      "parameters": "{\"content\":\"hi\",\"in_reply_to\":null}"
    },
    "result": {
      "Ok": "{\"Err\":{\"Internal\":\"{\\\"kind\\\":{\\\"ValidationFailed\\\":\\\"Signature of entry QmWY98zemN4Mi9A9SgmC8vQufaQUf5a13Xe81PfWDvvnn9 from author HcSCIvEzcZubrc3bcazGppc4Ep9Jbattn8m9V3MzPfzTon9g3QXPZQIBGquqqar invalid\\\"},\\\"file\\\":\\\"core/src/nucleus/ribosome/runtime.rs\\\",\\\"line\\\":\\\"192\\\"}\"}}"
    }
  }
}
```
