# `node-netflow-ntopng`

A NodeJS proxy that takes Cisco [NetFlow](https://en.wikipedia.org/wiki/NetFlow) flow descriptor data and converts it into the strange JSON-over-ZMQ format that is expected by [`ntopng`](https://www.ntop.org/products/traffic-analysis/ntop/) without the [requirement](https://www.ntop.org/guides/ntopng/case_study/using_with_nprobe.html) for the (paid) `nprobe` tool.

You can use this in concert with the [Traffic Flow](https://help.mikrotik.com/docs/display/ROS/Traffic+flow) tooling built into MikroTik RouterOS to collect statistics on traffic flows within your network. Just add a Traffic Flow target and point it to the port `node-netflow-ntopng` is listening on (see **Configuration** below).

One minor **todo** is to implement (optional) DNS resolution of traffic sources and destinations so that `ntopng` displays hostnames rather than just IPs.

## Configuration

Pretty hacky at the minute, sorry. Either edit the script or use the following environment variables:

* `NETFLOW_NTOPNG_ZMQ` - The ZMQ URL to bind to and listen for `ntopng` to subscribe to flow information. `tcp://0.0.0.0:5556` by default.
* `NETFLOW_NTOPNG_NF_PORT` - The port number on which to bind and listen for Netflow traffic. `3000` by default.

## Caveats

This will perform fairly terribly compared to `nprobe`. I haven't performed any benchmarks but NodeJS is single-threaded. If you need performance, buy `nprobe`. There we go, it now has a reason to exist other than to remove functionality from `ntopng` and make it billable. Huzzah.
