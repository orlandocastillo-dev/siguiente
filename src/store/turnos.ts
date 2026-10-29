import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import { codigoTurno, MODULOS, type ServicioId } from "../dominio/oficina";

export type EstadoTurno = "espera" | "llamado" | "atendiendo" | "atendido" | "ausente";

export interface Turno {
  id: string;
  codigo: string;
  servicio: ServicioId;
  estado: EstadoTurno;
  creado: number;
  llamado?: number;
  inicio?: number;
  fin?: number;
  modulo?: number;
  llamadas: number;
}

export interface Anuncio {
  turnoId: string;
  modulo: number;
  /** Sube con cada llamado (también al volver a llamar) para que la sala sepa que debe anunciar. */
  vez: number;
}

export interface EstadoTurnos {
  dia: string;
  turnos: Turno[];
  consecutivos: Record<ServicioId, number>;
  enModulo: Record<number, string | null>;
  anuncio: Anuncio | null;
}

export const hoy = (ahora = Date.now()) => new Date(ahora).toLocaleDateString("sv-SE");

export const estadoVacio = (dia = hoy()): EstadoTurnos => ({
  dia,
  turnos: [],
  consecutivos: { C: 0, A: 0, R: 0, P: 0 },
  enModulo: Object.fromEntries(MODULOS.map((m) => [m.numero, null])),
  anuncio: null,
});

interface EnModulo {
  modulo: number;
  en: number;
}

const turnoDelModulo = (s: EstadoTurnos, modulo: number) => {
  const id = s.enModulo[modulo];
  return id ? s.turnos.find((t) => t.id === id) : undefined;
};

// Si el módulo llama a otro sin cerrar el anterior, el anterior se da por atendido
const cerrarActual = (s: EstadoTurnos, modulo: number, en: number) => {
  const actual = turnoDelModulo(s, modulo);
  if (actual && (actual.estado === "llamado" || actual.estado === "atendiendo")) {
    actual.estado = "atendido";
    actual.inicio ??= actual.llamado;
    actual.fin = en;
  }
  s.enModulo[modulo] = null;
};

const turnos = createSlice({
  name: "turnos",
  initialState: estadoVacio(),
  reducers: {
    tomarTurno: {
      reducer(s, { payload }: PayloadAction<{ servicio: ServicioId; id: string; en: number }>) {
        const n = (s.consecutivos[payload.servicio] ?? 0) + 1;
        s.consecutivos[payload.servicio] = n;
        s.turnos.push({ id: payload.id, codigo: codigoTurno(payload.servicio, n), servicio: payload.servicio, estado: "espera", creado: payload.en, llamadas: 0 });
      },
      prepare: (servicio: ServicioId) => ({ payload: { servicio, id: nanoid(), en: Date.now() } }),
    },

    llamar(s, { payload }: PayloadAction<EnModulo & { turnoId: string }>) {
      const turno = s.turnos.find((t) => t.id === payload.turnoId);
      // Otra ventanilla pudo llamarlo un instante antes
      if (!turno || turno.estado !== "espera") return;
      cerrarActual(s, payload.modulo, payload.en);
      turno.estado = "llamado";
      turno.modulo = payload.modulo;
      turno.llamado = payload.en;
      turno.llamadas = 1;
      s.enModulo[payload.modulo] = turno.id;
      s.anuncio = { turnoId: turno.id, modulo: payload.modulo, vez: (s.anuncio?.vez ?? 0) + 1 };
    },

    rellamar(s, { payload }: PayloadAction<EnModulo>) {
      const turno = turnoDelModulo(s, payload.modulo);
      if (!turno || turno.estado !== "llamado") return;
      turno.llamadas += 1;
      s.anuncio = { turnoId: turno.id, modulo: payload.modulo, vez: (s.anuncio?.vez ?? 0) + 1 };
    },

    empezar(s, { payload }: PayloadAction<EnModulo>) {
      const turno = turnoDelModulo(s, payload.modulo);
      if (!turno || turno.estado !== "llamado") return;
      turno.estado = "atendiendo";
      turno.inicio = payload.en;
    },

    terminar(s, { payload }: PayloadAction<EnModulo>) {
      cerrarActual(s, payload.modulo, payload.en);
    },

    noSePresento(s, { payload }: PayloadAction<EnModulo>) {
      const turno = turnoDelModulo(s, payload.modulo);
      if (!turno || turno.estado !== "llamado") return;
      turno.estado = "ausente";
      turno.fin = payload.en;
      s.enModulo[payload.modulo] = null;
    },

    reemplazar: (_s, { payload }: PayloadAction<EstadoTurnos>) => payload,
  },
});

export const { tomarTurno, llamar, rellamar, empezar, terminar, noSePresento, reemplazar } = turnos.actions;
export default turnos.reducer;

/** El siguiente turno para un módulo: primero preferencial si lo atiende, luego el que llegó antes. */
export function siguientePara(s: EstadoTurnos, numeroModulo: number): Turno | undefined {
  const servicios = MODULOS.find((m) => m.numero === numeroModulo)?.servicios ?? [];
  const esperando = s.turnos.filter((t) => t.estado === "espera" && servicios.includes(t.servicio));
  const preferencial = esperando.filter((t) => t.servicio === "P");
  const fila = preferencial.length ? preferencial : esperando;
  return fila.reduce<Turno | undefined>((primero, t) => (!primero || t.creado < primero.creado ? t : primero), undefined);
}
