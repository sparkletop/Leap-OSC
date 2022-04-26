const argList = (argument) => {
  if (typeof argument == 'string') {
    return {
      type: 's',
      value: argument,
    };
  } else if (typeof argument == 'number') {
    return {
      type: Number.isInteger(argument) ? 'i' : 'f',
      value: argument,
    };
  } else if (Array.isArray(argument)) {
    return argument.map(argList);
  } else {
    console.error('OSC type tag not defined for:', typeof argument);
    console.log('Data:', argument);
  }
};

module.exports = function (address, argument) {
  return {
    address: address,
    args: [argList(argument)].flat(),
  };
};
