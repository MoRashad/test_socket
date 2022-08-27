const request = require("request");
const socketio = require("socket.io");
const Contract = require("web3-eth-contract");
const express = require("express");
const http = require("http");
const pkgAgent = require("@dfinity/agent");
const { HttpAgent, Actor } = pkgAgent;

let coinbaseBtc, coinbaseEth, binanceBtc, binanceEth, avgBtc, avgEth;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const idlFactory = ({ IDL }) => {
  const PriceData = IDL.Record({
    signature: IDL.Text,
    provider: IDL.Text,
    asset: IDL.Nat32,
    timestamp: IDL.Text,
    is_closed: IDL.Bool,
    price: IDL.Text,
  });
  return IDL.Service({
    add_data: IDL.Func([IDL.Nat32, PriceData], [IDL.Bool], []),
    add_node: IDL.Func([IDL.Principal], [IDL.Opt(IDL.Principal)], []),
    get_caller: IDL.Func([], [IDL.Principal], ["query"]),
    get_data: IDL.Func([IDL.Nat32], [IDL.Vec(PriceData)], ["query"]),
    get_nodes: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    get_owner: IDL.Func([], [IDL.Opt(IDL.Principal)], ["query"]),
    remove_node: IDL.Func([IDL.Principal], [IDL.Opt(IDL.Principal)], []),
  });
};

async function getICPPrice(pair) {
  const canisterId = "ffs6z-fyaaa-aaaao-aai6q-cai";

  const host = "https://ic0.app";

  const agent = new HttpAgent({ fetch, host });

  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  var f = await actor.get_data(pair);

  return f;
}

async function work(pairIndex) {
  var icp_data = await getICPPrice(pairIndex);
  // console.log(icp_data[0].price / 1e18);
  return icp_data[0].price / 1e18;
}

setInterval(async () => {
  request(
    "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    function (error, response, body) {
      let data = JSON.parse(body);
      binanceBtc = parseFloat(data.price);
    }
  );
  request(
    "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT",
    function (error, response, body) {
      let data = JSON.parse(body);
      binanceEth = parseFloat(data.price);
    }
  );
  request(
    "https://api.coinbase.com/v2/prices/BTC-USD/spot",
    function (error, response, body) {
      let data = JSON.parse(body);
      // console.log(data.data.amount);
      coinbaseBtc = parseFloat(data.data.amount);
    }
  );
  request(
    "https://api.coinbase.com/v2/prices/ETH-USD/spot",
    function (error, response, body) {
      let data = JSON.parse(body);
      // console.log(data.data.amount);
      coinbaseEth = parseFloat(data.data.amount);
    }
  );
  avgBtc = (binanceBtc + coinbaseBtc) / 2;
  avgEth = (binanceEth + coinbaseEth) / 2;

  if (!isNaN(avgBtc) && !isNaN(avgEth)) {
    console.log("BTC price :  " + avgBtc);

    console.log("ETH price :  " + avgEth);
    console.log("\n");
    let icpBtc = await work(0);
    console.log(icpBtc);
    let icpEth = await work(1);
    console.log(icpEth);
    io.emit("price", { avgBtc, avgEth, icpBtc, icpEth });
  }
}, 1000);
// io.on("connection", (socket) => {
//   console.log("user connected", socket);
// });

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("listening on *:3000");
});
