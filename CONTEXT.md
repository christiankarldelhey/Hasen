# Hasen

Juego de cartas de bazas y apuestas con triunfo fijo (Flores), heredero del Karnöffel. El reglamento canónico es el que implementa el código de `domain/`.

## Language

### Estructura de la partida

**Partida** (Match):
Unidad completa de juego; termina cuando el Mazo de apuestas ya no alcanza para un Pool completo.
_Avoid_: Juego, game

**Vuelta** (Lap):
Secuencia de Rondas en la que cada jugador es Mano exactamente una vez. Una Partida siempre tiene un número entero de Vueltas.
_Avoid_: Ciclo

**Ronda** (Round):
Reparto de cartas seguido de 5 Bazas.
_Avoid_: Mano (en el sentido de "una mano de truco")

**Baza** (Trick):
Cada jugador juega una carta; la gana la carta más fuerte según la jerarquía.
_Avoid_: Truco, trick (en textos en español)

### Posiciones

**Mano** (Mano):
Primer jugador de la Ronda; rota una posición por Ronda.
_Avoid_: Lead player (para la Ronda), primer jugador

**Salida** (Lead):
Jugador que abre una Baza. En la primera Baza coincide con la Mano; después suele ser quien ganó la Baza anterior.
_Avoid_: Mano (para una Baza)

### Apuestas

**Mazo de apuestas** (Bid Deck):
Conjunto de apuestas de un tipo que se va gastando a lo largo de la Partida; las apuestas usadas no vuelven.
_Avoid_: Bid pool (para el mazo)

**Pool de apuestas** (Bid Pool):
Apuestas reveladas para una Ronda, siempre completo (misma cantidad por tipo).
_Avoid_: Mazo (para el pool)

**Ventana** (Bid Window):
Cada una de las tres primeras Bazas, durante la cual cada jugador puede hacer como máximo una apuesta.
_Avoid_: Turno de apuesta

**Colección** (Collection Bid):
Apuesta a juntar cartas de un palo; se cumple si el Neto llega al Piso de la apuesta. No existe palo prohibido.
_Avoid_: Set collection, palo a evitar, avoid suit

**Neto** (Collection Net):
Valor de una Colección: 15 por cada carta del palo apostado menos 2, 4 o 6 por cada carta de otro palo, según la Ventana en que se apostó.

**Piso** (Collection Floor):
Neto mínimo que exige una Colección (10 o 20). Por debajo del Piso se paga la multa; el Neto negativo nunca se cobra.

**Apuesta solitaria** (Solitary Bid):
Apuesta cuyo cumplimiento hace imposible cumplir cualquier apuesta de otro tipo (ej. "Ninguna baza").

**Duelo** (Bid Duel):
Situación en que dos jugadores comparten una apuesta y uno la cumple y el otro no.

### Interacción

**Carga** (Feeding):
Tirar una carta con puntos o de un palo determinado en una Baza que ganará otro jugador, a propósito.
_Avoid_: Schmieren

**Sabotaje** (Sabotage):
Jugada hecha para hacer fallar la apuesta de un rival, ya sea cargándole cartas que lo perjudican o negándole las que necesita.
