const osc = require('osc');
const Leap = require('leapjs');
const yaml = require('yaml');
const fs = require('fs');
const message = require('./message');
const distance3d = require('./distance3d');

const config = yaml.parse(fs.readFileSync('./config.yaml', 'utf8'));

const parameters = config.parameters.filter((param) => param != 'translation');

// set up OSC communication
const port = new osc.UDPPort({
  remoteAddress: config.addresses.targetIP,
  remotePort: config.addresses.targetPort,
  localAddress: config.addresses.localIP,
  localPort: config.addresses.localPort,
});

port.open();

port.on('ready', () => {
  console.log(
    `Opened UDP connection to ${config.addresses.targetIP}:${config.addresses.targetPort} from ${config.addresses.localIP}:${config.addresses.localPort}`
  );
  port.send({ address: '/leap/ready' });
});

port.on('error', function (error) {
  console.error('An OSC error ocurred:', error.message);
});

// interframe data
let previousFrame;
const present = { left: false, right: false };

// main controller input loop
const controller = Leap.loop({ enableGestures: false }, (frame) => {
  const handsInFrame = { left: false, right: false };
  if (frame.hands.length) {
    // create OSC messages
    const messages = [];

    frame.hands.forEach((hand) => {
      //console.log(hand);

      if (hand.confidence > config.confidenceThreshold) {
        const addr = (pathEnd) => `/leap/${hand.type}/${pathEnd}`;

        parameters.forEach((parameter) => {
          messages.push(message(addr(parameter), hand[parameter]));
        });

        // translation (interframe movement) needs special care
        if (
          config.parameters.includes('translation') &&
          previousFrame &&
          previousFrame.valid
        ) {
          const translation = Array.from(hand.translation(previousFrame));
          messages.push(message(addr('translation'), translation));
          messages.push(
            message(
              addr('translationLength'),
              distance3d(translation, [0, 0, 0])
            )
          );
        }

        messages.push({ address: `/leap/${hand.type}/newFrame` });

        // save hand id
        handsInFrame[hand.type] = true;
      }
    });

    // send OSC messages
    messages.forEach((message) => port.send(message));
  }

  // check hand entry/exit
  ['left', 'right'].forEach((side) => {
    // check for hand entry
    if (!present[side] && handsInFrame[side]) {
      present[side] = true;
      port.send({ address: `/leap/${side}/enter` });
    }
    // check for hand disappearance
    if (present[side] && !handsInFrame[side]) {
      present[side] = false;
      port.send({ address: `/leap/${side}/exit` });
    }
  });
  // save frame data
  previousFrame = frame;
});

controller.setBackground(true);

console.log('Leap controller main loop started');
