const osc = require('osc');
const Leap = require('leapjs');

const config = require('./config.json');

console.log('First steps');

const port = new osc.UDPPort({
  remoteAddress: config.targetIP,
  remotePort: config.targetPort,
  localAddress: config.localIP,
  localPort: config.localPort,
});

port.open();

port.on('ready', () => {
  port.send({
    address: '/test',
    args: [
      {
        type: 'i',
        value: 50,
      },
    ],
  });
});

port.on('error', function (error) {
  console.log('An error occurred: ', error.message);
});
