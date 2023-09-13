self.onconnect = function (e) {
  console.log('connect', e);
  const port = e.ports[0];
  port.onmessage = function (e) {
    console.log('port', e);
  };
};
