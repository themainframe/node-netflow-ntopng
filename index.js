// Create a netflow collector
var Collector = require('node-netflowv9');
 
// Create a ZMQ producer
var zmq = require("zeromq");
var sock = zmq.socket("pub");

// Bind ZMQ socket
sock.bindSync(process.env.hasOwnProperty('NETFLOW_NTOPNG_ZMQ') ? process.env.NETFLOW_NTOPNG_ZMQ : "tcp://0.0.0.0:5556");
console.log("zmq producer bound", process.env.hasOwnProperty('NETFLOW_NTOPNG_ZMQ') ? process.env.NETFLOW_NTOPNG_ZMQ : "tcp://0.0.0.0:5556");

// Define the NetFlow field names mapped to their numbers
// (https://www.ietf.org/rfc/rfc3954.txt)
var fieldTypeMappings = {
    "ipv4_src_addr": 8,
    "ipv4_dst_addr": 12,
    "ipv4_next_hop": 15,
    "input_snmp": 10,
    "output_snmp": 14,
    "in_pkts": 2,
    "in_bytes": 1,
    "first_switched": 22,
    "last_switched": 21,
    "ipv4_src_port": 7,
    "ipv4_dst_port": 11,
    "tcp_flags": 6,
    "protocol": 4,
    "src_tos": 5,
    "in_as": 16,
    "out_as": 17,
    "src_mask": 9,
    "dst_mask": 13
};

// Message ID
let id = 1;

// For each flow burst we receive, format it and publish via ZMQ
Collector((burst) => {

    burst.flows.forEach(flow => {

        // Produce an ntopng object representative of this flow
        var ntopngFlow = {};
        var keys = Object.keys(flow);
        keys.forEach(key => {
            if (fieldTypeMappings.hasOwnProperty(key)) {
                ntopngFlow[fieldTypeMappings[key]] = flow[key];
            }
        });
        
        // Publish the flow
        console.log(
            'flow ' + id + ': ', flow.ipv4_src_addr + ':' + flow.ipv4_src_port + 
            ' -> ' + flow.ipv4_dst_addr + ':' + flow.ipv4_dst_port
        );

        // Generate the header
        const headerBuffer = Buffer.alloc(24);
        headerBuffer.write("flow", 0, "utf-8");
        headerBuffer.writeInt8(2, 16); // Version
        headerBuffer.writeInt8(1, 17); // Source ID
        headerBuffer.writeUInt16BE(24, 18); // Size
        headerBuffer.writeUInt32BE(id ++, 20); // Message ID
        
        // Send a header indicating what payload we'll be using
        sock.send(headerBuffer.toString('ascii'), zmq.ZMQ_SNDMORE);     

        // Send the actual flow content
        let json = JSON.stringify(ntopngFlow);
        sock.send(json, 0);

        // Wrap-around message ID
        if (id >= 4294967295) {
            id = 1;
        }

    });

}).listen(parseInt(
    process.env.hasOwnProperty('NETFLOW_NTOPNG_NF_PORT') ? process.env.NETFLOW_NTOPNG_NF_PORT : "3000"
));
