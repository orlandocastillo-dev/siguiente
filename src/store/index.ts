import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import turnosReducer, { estadoVacio, hoy, llamar, reemplazar, siguientePara, type EstadoTurnos } from "./turnos";

const CLAVE = "siguiente:dia";
const canal = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("siguiente") : null;

function leerGuardado(): EstadoTurnos {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as EstadoTurnos | null;
    // Cada día empieza la fila en cero
    if (guardado?.dia === hoy()) return guardado;
  } catch {
    /* sin almacenamiento, arranca vacío */
  }
  return estadoVacio();
}

type AccionRemota = UnknownAction & { meta?: { remota?: boolean } };

// Cada acción de la fila se guarda y se avisa a las otras pestañas, que la aplican igual
const sincronizar: Middleware = (api) => (next) => (accion) => {
  const resultado = next(accion);
  const a = accion as AccionRemota;
  if (typeof a.type === "string" && a.type.startsWith("turnos/")) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify((api.getState() as Estado).turnos));
    } catch {
      /* el almacenamiento puede estar lleno o bloqueado */
    }
    if (!a.meta?.remota) canal?.postMessage(accion);
  }
  return resultado;
};

export const store = configureStore({
  reducer: { turnos: turnosReducer },
  preloadedState: { turnos: leerGuardado() },
  middleware: (m) => m().concat(sincronizar),
});

canal?.addEventListener("message", (e: MessageEvent<AccionRemota>) => {
  store.dispatch({ ...e.data, meta: { ...e.data.meta, remota: true } });
});

export type Estado = ReturnType<typeof store.getState>;
export type Despacho = typeof store.dispatch;
export const useDespacho = useDispatch.withTypes<Despacho>();
export const useEstado = useSelector.withTypes<Estado>();

/** Busca el siguiente con el estado actual y manda la acción ya resuelta, para que todas las pestañas llamen al mismo. */
export const llamarSiguiente = (modulo: number) => (dispatch: Despacho, getState: () => Estado) => {
  const turno = siguientePara(getState().turnos, modulo);
  if (turno) dispatch(llamar({ modulo, turnoId: turno.id, en: Date.now() }));
  return turno;
};

export const empezarDia = () => reemplazar(estadoVacio());
