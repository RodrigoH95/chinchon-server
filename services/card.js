const io = require("socket.io");

class CardService {
  constructor() {
    this.carta = 0;
    this.palos = ["copas", "oro", "espadas", "basto"];
    this.mazo = [];
    this.descarte = [];
  }

  generarMazo() {
    this.descarte = [];
    this.mazo = [];
    this.mazo.push({ valor: "", palo: "comodin" });
    this.mazo.push({ valor: "", palo: "comodin" });
    for (let i = 0; i < 4; i++) {
      let palo = this.palos[i];
      for (let j = 0; j < 12; j++) {
        this.mazo.push({ valor: j + 1, palo });
      }
    }
  }

  getMazo() {
    return this.mazo;
  }

  getCarta() {
    return this.carta;
  }

  descartar(carta) {
    this.descarte.push(carta);
  }

  drawOneCard() {
    const index = Math.floor(Math.random() * this.mazo.length);
    this.carta = index;
    // Chequear si no quedan cartas desde el servidor
    if(this.mazo.length === 0) {
      this.mazo = this.descarte;
      this.descarte = [];
      return;
    }
    const valor = this.mazo[this.carta].valor;
    const palo = this.mazo[this.carta].palo;
    this.mazo.splice(index, 1);

    return {valor, palo}
  }
}

module.exports = CardService;
