class CalculadoraDeResultados {
  static comodines;
  static mazoFinal;

  static calcular(mazo) {
    let puntajeFinal = 150;

    for (let i = 0; i < 2; i++) {
      this.mazoFinal = [...mazo];
      this.comodines = this.mazoFinal.filter(
        (carta) => carta.palo === "comodin"
      ).length;

      if (i) {
        this.calcularParejas();
        this.calcularEscaleras();
      } else {
        this.calcularEscaleras();
        this.calcularParejas();
      }

      let puntaje = this.calcularPuntaje();
      
      if (puntaje < puntajeFinal) {
        puntajeFinal = puntaje;
      }
    }
    return puntajeFinal;
  }

  static calcularPuntaje() {
    
    return this.mazoFinal
      .map((card) => card.valor)
      .reduce((acc, value) => acc + value, 0);
  }

  static contarValores(valores) {
    let obj = {};
    valores.forEach((valor) => {
      if (valor in obj) {
        obj[valor] += 1;
      } else {
        obj[valor] = 1;
      }
    });

    return obj;
  }

  static ordernarPorPalos(mazo, palos) {
    let obj = {};
    palos.forEach(
      (palo) =>
        (obj[palo] = mazo
          .filter((carta) => carta.palo === palo)
          .map((carta) => carta.valor)
          .sort((a, b) => a - b))
    );
    this.separarValores(obj);

    return obj;
  }

  static separarValores(obj) {
    for (let palo in obj) {
      let result = [];
      let arr = obj[palo];
      let currentValue = arr[0];
      let itemsAmount = 0;
      let index = 0;
      for (let i = 1; i < arr.length; i++) {
        itemsAmount++;
        if (currentValue - arr[i] < -2) {
          let corte = arr.slice(index, itemsAmount);
          index = i;
          result.push(corte);
        }
        currentValue = arr[i];
      }
      let corte = arr.slice(index, arr.length);
      result.push(corte);
      obj[palo] = result;
    }
  }

  static buscarParejas(obj) {
    let result = [];
    for (let valor in obj) {
      if (obj[valor] == 2 && this.comodines) {
        result.push(valor + "*");
        this.comodines--;
      } else if (obj[valor] > 2) {
        result.push(valor);
      }
    }
    return result;
  }

  static buscarEscaleras(obj) {
    let result = {};
    for (let palo in obj) {
      result[palo] = [];
      const arr = obj[palo].reverse(); // Primero intenta formar combinaciones con los valores mas altos
      for (let valores of arr) {
        if (valores.length <= 1) continue;
        else if (valores.length >= 2) {
          let comodinUtilizado = false;
          let currentValue = valores[0];
          let escalera = [currentValue];

          for (let i = 1; i < valores.length; i++) {
            if (currentValue - valores[i] == -2) {
              if (this.comodines && !comodinUtilizado) {
                this.comodines--;
                comodinUtilizado = true;
                const cartaComodin = "*"; // currentValue + 1 + "*" -> mas especifico
                escalera.push(cartaComodin);
                escalera.push(valores[i]);
              }
              //else continue; no parece cumplir ninguna funcion
            } else if (currentValue - valores[i] == -1) {
              escalera.push(valores[i]);
            }

            currentValue = valores[i];
          }


          if (escalera.length == 2) {
            if (this.comodines && !comodinUtilizado) {
              escalera.push("*"); //escalera[escalera.length - 1] + 1 + "*" -> mas especifico
              comodinUtilizado = true;
              this.comodines--;
            } else escalera = null;
          }
          if (escalera && escalera.length > 2) {
            result[palo].push(escalera);
            escalera.forEach((valor) => {
              this.extraerCartaDelMazo(palo, valor);
            });
          }
        }
      }
    }
    return result;
  }

  static extraerCartaDelMazo(palo, valor) {
    
    if (typeof valor === "string") {
      if (valor === "*") {
        this.extraerCartaDelMazo("comodin", "");
      } else if (valor.includes("*")) {
        this.extraerCartaDelMazo("comodin", "*");
        valor = Number(valor[0]);
      }
    }
    if (palo === "*") {
      this.mazoFinal = this.mazoFinal.filter(
        (card) => card.valor !== Number(valor)
      );
      return;
    } else {
      this.mazoFinal = this.mazoFinal.filter(
        (card) => JSON.stringify(card) != JSON.stringify({ valor, palo })
      );
    }
  }

  static calcularEscaleras() {
    const palos = new Set(
      this.mazoFinal
        .filter((carta) => carta.palo !== "comodin")
        .map((carta) => carta.palo)
    );
    const cartasOrdenadasPorPalo = this.ordernarPorPalos(this.mazoFinal, palos);
    this.buscarEscaleras(cartasOrdenadasPorPalo, this.comodines);
  }

  static calcularParejas() {
    const valores = this.mazoFinal
      .filter((carta) => typeof carta.valor === "number")
      .map((carta) => carta.valor);
    const cantidades = this.contarValores(valores);
    const parejas = this.buscarParejas(cantidades, this.comodines).reverse(); // primero las de mayor valor
    parejas.forEach((valor) => this.extraerCartaDelMazo("*", valor));
  }
}

// let mazo = [
//   { valor: 6, palo: "oro" },
//   { valor: 2, palo: "copas" },
//   { valor: 6, palo: "basto" },
//   { valor: 2, palo: "oro" },
//   { valor: 5, palo: "copas" },
//   { valor: 4, palo: "basto" },
//   { valor: 6, palo: "copas" },
// ];

// CalculadoraDeResultados.calcular(mazo);

module.exports = CalculadoraDeResultados;
