const API_URL = process.env.VUE_APP_API_URL;

const tickerHandlers = new Map();
const currenciesToBTC = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_URL}`
);
// TODO: refactor this
const AGGRAGATE_INDEX = '5';
const INVALID_SUB_INDEX = '500';
const SUBSCRIPTION_ALREADY_ACTIVE = 'SUBSCRIPTION_ALREADY_ACTIVE';
socket.addEventListener('message', (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    TOSYMBOL: convertedCurrency,
    PRICE: newPrice,
    PARAMETER: subscription,
    MESSAGE: message,
  } = JSON.parse(e.data);
  if (type === INVALID_SUB_INDEX && message !== SUBSCRIPTION_ALREADY_ACTIVE) {
    const base = subscription.split('~')[2];
    const crossChainCurrency = subscription.split('~')[3];

    if (crossChainCurrency === 'BTC') {
      const handlers = tickerHandlers.get(base) ?? [];
      handlers.forEach((fn) => fn('-'));
      if (!tickerHandlers.has('BTC')) {
        unsubscribeFromTickerOnWs(crossChainCurrency);
      }
      return;
    }
    subscribeToTickerOnWs(base, crossChainCurrency, true);
    return;
  }

  if (type !== AGGRAGATE_INDEX || newPrice === undefined) {
    return;
  }

  if (convertedCurrency === 'BTC') {
    currenciesToBTC.set(currency, newPrice);
    return;
  }

  if (currenciesToBTC.size && currency === 'BTC') {
    for (let transpileCurrency of currenciesToBTC.entries()) {
      const handlers = tickerHandlers.get(transpileCurrency[0]) ?? [];
      handlers.forEach((fn) => fn(newPrice * transpileCurrency[1]));
    }
  }
  const handlers = tickerHandlers.get(currency) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    'open',
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(base, quote = 'USD', convertThroughBTC) {
  const subscriptions = convertThroughBTC
    ? [`5~CCCAGG~${base}~BTC`, `5~CCCAGG~BTC~USD`]
    : [`5~CCCAGG~${base}~${quote}`];
  sendToWebSocket({
    action: 'SubAdd',
    subs: subscriptions,
  });
}

function unsubscribeFromTickerOnWs(base, quote = 'USD') {
  sendToWebSocket({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${base}~${quote}`],
  });
}
export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickerHandlers.get(ticker) || [];
  tickerHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickerHandlers.delete(ticker);
  unsubscribeFromTickerOnWs(ticker);
};
