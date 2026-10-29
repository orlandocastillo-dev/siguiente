# Siguiente

Un sistema de turnos para una oficina de atención, como los de los bancos o las EPS. La persona saca su turno en el kiosco, el funcionario lo llama desde su ventanilla y la pantalla de la sala lo anuncia con timbre y voz. Así nadie tiene que estar preguntando "¿ya me llamaron?".

Lo hice para practicar estado compartido en tiempo real: cuatro pantallas que tienen que ver exactamente la misma fila sin pisarse.

**Demo:** https://siguiente.vercel.app

## Cómo probarlo

1. Abra la **sala de espera** en una pestaña (o mejor, en otra ventana al lado) y toque "Activar el sonido de los llamados".
2. En otra pestaña entre al **kiosco** y saque un par de turnos.
3. Vaya a la **ventanilla**, escoja un módulo y llame al siguiente. La sala lo anuncia en ese mismo momento.

Si quiere ver el panel con números de verdad, en la portada está el botón "Probar con una mañana de ejemplo", que llena el día con más de 80 turnos.

## Las pantallas

- `/kiosco`: se escoge el servicio (caja, asesoría, radicación o preferencial) y sale el tiquete con cuánta gente hay adelante y cuánto se demora.
- `/ventanilla?m=2`: llamar al siguiente, volver a llamar, empezar la atención o marcar que no se presentó. También con el teclado: N y R.
- `/sala`: el turno actual en fichas tipo aeropuerto, los últimos llamados y la espera por servicio.
- `/panel`: turnos del día, espera y atención promedio, llegadas por hora y cómo va cada módulo.

## Cómo está hecho

React 19, TypeScript y Vite. La fila vive en un solo slice de Redux Toolkit (`src/store/turnos.ts`), y ahí están las reglas de la oficina:

- Cada módulo atiende ciertos servicios, y los que atienden preferencial lo llaman primero.
- Si dos ventanillas llaman al mismo turno casi al tiempo, gana la primera y la otra acción se descarta.
- Si un módulo llama a otro sin cerrar el que tenía, el anterior queda como atendido.

Cada acción se guarda en `localStorage` y se manda a las demás pestañas por `BroadcastChannel`, que la aplican igual. El timbre sale de Web Audio y la voz de Web Speech, sin archivos de sonido.

Las reglas tienen pruebas con Vitest.

```bash
npm install
npm run dev    # http://localhost:5173
npm test
```

## Lo que falta

La sincronización funciona entre pestañas del **mismo navegador**: sirve para mostrarlo, pero en una oficina real el kiosco, las ventanillas y el televisor son equipos distintos. El paso siguiente sería un servidor con NestJS y Socket.IO que guarde la fila y reparta los cambios, con la misma lógica del slice.

---

Orlando Castillo, Barranquilla, 2025 – 2026.
