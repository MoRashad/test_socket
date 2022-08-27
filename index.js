const request = require("request");
const socketio = require("socket.io");
const express = require("express");
const http = require("http");
let coinbaseBtc, coinbaseEth, binanceBtc, binanceEth, avgBtc, avgEth;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

setInterval(() => {
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
  }
}, 1000);

io.on("connection", (socket) => {
  socket.on("message", (msg) => {
    io.emit("message", "Hello");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
