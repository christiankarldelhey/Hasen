# Principios de diseño del catálogo de apuestas

Para reducir el peso del azar sin cambiar el alma de Hasen, todo cambio al catálogo de apuestas se evalúa contra estos principios: (1) tres tipos, Bazas, Puntos y Colección; (2) ninguna apuesta imposible con ninguna cantidad de jugadores; (3) ninguna apuesta arruinable con facilidad mediante Sabotaje (algo de Sabotaje se acepta, el extremo no); (4) el premio sube con la dificultad real medida, no intuida; (5) combinaciones sin redundancias (ninguna apuesta implica automáticamente otra de otro tipo), con una escalera de mano fuerte moderada y con combinaciones coherentes y con tensión; (6) al menos alguna apuesta prefiere una mano débil; (7) ninguna apuesta puede quedar resuelta o casi resuelta por lo ocurrido antes de la última Ventana: las condiciones de Bazas se definen en las bazas 4 y 5, y las de cantidad total deben seguir siendo exigentes aunque se apuesten en la Ventana 3.

## Considered Options

- Agregar un mecanismo de respuesta a las apuestas ("Contra", estilo Kontra del skat): rechazado por sumar reglas y UI.
- Eliminar las apuestas difíciles: rechazado; las apuestas difíciles y bien pagadas son deseables mientras no sean imposibles.

## Consequences

Simulaciones del catálogo original (4 jugadores) mostraron apuestas casi imposibles ("Las 5", "Gana 4 o 5", "45+"), precios invertidos respecto de la dificultad, Sabotaje fuerte en Puntos bajos y en Colección con palo prohibido, y combinaciones de mano fuerte que cobran doble (lift > 20).
