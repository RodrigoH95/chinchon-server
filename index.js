const express = require("express");
const app = express();
const server = require("http").createServer(app);
const CardService = require("./services/card");
const Calculadora = require("./calculadora");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let players = [];
const cardManager = new CardService();
let turn = null;

function getId(index) {
  if(!players[index]) return;
  const id = players[index].id;
  return String(id);
}

function repartirCartas(cardManager) {
  let cards = 14;
  cardManager.generarMazo();
  const interval = setInterval(() => {
    let carta = cardManager.drawOneCard();
    io.to(getId(Number(turn))).emit("recibe-carta", carta);
    io.to(getId(Number(!turn))).emit("oponente-recibe", carta);
    agregarCartaAJugador(getId(Number(turn)), carta);
    turn = !turn;
    cards--;
    if (cards === 0) {
      const id = getId(Number(turn));
      clearInterval(interval);
      const cartaInicial = cardManager.drawOneCard();
      io.emit("descarta", cartaInicial);
      cardManager.descartar(cartaInicial);
      io.emit("turno", id);
    }
  }, 300);
}

function iniciarPartida() {
  io.emit("match-start");
  players.forEach((player) => (player.cards = []));
  turn = Math.floor(Math.random() * players.length);

  repartirCartas(cardManager);
}

function nuevaRonda() {
  io.emit("round-start");
  players.forEach((player) => (player.cards = []));
  turn = !turn;
  repartirCartas(cardManager);
}

function jugadorRecibeCarta(socket, carta) {
  io.to(socket.id).emit("recibe-carta", carta);
  socket.broadcast.emit("oponente-recibe", carta);
  agregarCartaAJugador(socket.id, carta);
}

function agregarCartaAJugador(id, carta) {
  players.find(player => player.id === id).cards.push(carta);
}

io.on("connection", (socket) => {
  if (players.length === 2) return; // temporal para no llenar la sala con mas de 2 jugadores

  socket.on("user-join", (name) => {
    const player = {
      id: socket.id,
      name,
      cards: [],
      puntaje: 0,
    };
    players.push(player);

    io.emit("other-join", players);
    if (players.length >= 2) {
      iniciarPartida();
    }
  });

  socket.on("toma-carta", () => {
    const carta = cardManager.drawOneCard();
    jugadorRecibeCarta(socket, carta);
    if (cardManager.getMazo().length === 0) {
      io.emit("no-cards");
      cardManager.drawOneCard();
    }
  });

  socket.on("descarta", (carta, index, corta = false) => {
    cardManager.descartar(carta);
    //index representa la ubicacion en el DOM de la carta vista desde el lado del oponente
    socket.broadcast.emit("descarta", carta, index, corta);
    const player = players.find(player => player.id === socket.id);
    player.cards = player.cards.filter(playerCard => JSON.stringify(playerCard) !== JSON.stringify(carta));
  });

  socket.on("toma-descarte", () => {
    const carta = cardManager.descarte.pop();
    io.emit("eliminar-descarte");
    jugadorRecibeCarta(socket, carta);
  });

  socket.on("finaliza-turno", () => {
    turn = !turn;
    const id = getId(Number(turn));
    io.emit("turno", id);
  });

  socket.on("finaliza-ronda", () => {
    console.log("Servidor comienza a calcular resultados");
    players.forEach(player => {
      console.log("Puntaje de", player.name, ":", Calculadora.calcular(player.cards));
    })
    const puntajes = [];
    players.forEach(player => {
      puntajes.push({
        id: player.id,
        puntaje: player.puntaje + Calculadora.calcular(player.cards),
      })
    })
    io.emit("finaliza-ronda", puntajes);
    setTimeout(() => {
      nuevaRonda();
    }, 1500);
  });

  socket.on("disconnect", (reason) => {
    setTimeout(() => {
      if(!socket.connected) {
        players = players.filter((player) => player.id !== socket.id);
        console.log(socket.id, "disconnected:", reason)
      }
    }, 5000);
  });
});

server.listen(3000, () => {
  console.log("Running on port", 3000);
});
