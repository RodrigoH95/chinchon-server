const express = require("express");
const app = express();
const server = require("http").createServer(app);
const CardService = require("./services/card");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let players = [];
const cardManager = new CardService();
let turn = null;

io.on("connection", (socket) => {
  if (players.length === 2) return; // temporal para no llenar la sala con mas de 2 jugadores
  
  const player = {
    id: socket.id,
    cards: [],
  };
  players.push(player);
  if (players.length >= 2) {
    
    io.emit("match-start");
    players.forEach((player) => (player.cards = []));
    turn = Math.floor(Math.random() * players.length);
    console.log("Turno", turn);
    repartirCartas(cardManager);
  }

  function repartirCartas(cardManager) {
    let cards = 14;
    cardManager.generarMazo();
    const interval = setInterval(() => {
      let carta = cardManager.drawOneCard();
      io.to(players[Number(!turn)].id).emit("recibe-carta", carta);
      io.to(players[Number(turn)].id).emit("oponente-recibe", carta);
      turn = !turn;
      cards--;
      if (cards === 0) {
        clearInterval(interval);
        const descarta = cardManager.drawOneCard();
        io.emit("descarta", descarta);
        cardManager.descartar(descarta);
        io.to(players[(Number(turn))].id).emit("turno");
      }
    }, 300);
  }

  socket.on("toma-carta", () => {
    if(cardManager.getMazo().length === 0) {
      cardManager.drawOneCard();
      io.emit("no-cards");
      return;
    };
    const carta = cardManager.drawOneCard();
    io.to(socket.id).emit("recibe-carta", carta);
    socket.broadcast.emit("oponente-recibe", carta);
  })

  socket.on("descarta", (id, carta, index) => {
    
    cardManager.descartar(carta);
    socket.broadcast.emit("descarta", carta, index);
  })

  socket.on("toma-descarte", () => {
    const carta = cardManager.descarte.pop()
    io.emit("eliminar-descarte");
    io.to(socket.id).emit("recibe-carta", carta);
    socket.broadcast.emit("oponente-recibe", carta);
  })

  socket.on("finaliza-turno", () => {
    turn = !turn;
    io.to(players[(Number(turn))].id).emit("turno");
  })

  socket.on("disconnecting", (reason) => {  
    players = players.filter((player) => player.id !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Running on port", 3000);
});
