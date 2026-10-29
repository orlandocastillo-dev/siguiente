import { MODULOS, codigoTurno, type ServicioId } from "../dominio/oficina";
import { estadoVacio, hoy, type EstadoTurnos, type Turno } from "./turnos";

// Generador con semilla: el día de ejemplo sale igual cada vez
function azar(semilla: number) {
  return () => {
    semilla = (semilla * 1664525 + 1013904223) % 4294967296;
    return semilla / 4294967296;
  };
}

const MIN = 60_000;

/** Una mañana de oficina: tres horas de turnos ya atendidos, gente esperando y módulos ocupados. */
export function diaDeEjemplo(ahora = Date.now()): EstadoTurnos {
  const r = azar(2026);
  const s = estadoVacio(hoy(ahora));
  const pesos: [ServicioId, number][] = [["C", 0.42], ["A", 0.28], ["R", 0.18], ["P", 0.12]];
  const elegir = () => {
    let x = r();
    for (const [id, p] of pesos) if ((x -= p) <= 0) return id;
    return "C" as ServicioId;
  };

  // Llegadas cada 1 a 4 minutos durante las últimas tres horas
  let t = ahora - 180 * MIN;
  while (t < ahora - 2 * MIN) {
    const servicio = elegir();
    const n = ++s.consecutivos[servicio];
    s.turnos.push({ id: `ej-${s.turnos.length}`, codigo: codigoTurno(servicio, n), servicio, estado: "espera", creado: t, llamadas: 0 });
    // Al final llega más gente de la que alcanzan a atender, como a media mañana
    t += (t > ahora - 25 * MIN ? 0.5 + r() * 0.9 : 1 + r() * 3) * MIN;
  }

  // Se simula la atención módulo por módulo, en orden de llegada
  const libre = new Map(MODULOS.map((m) => [m.numero, ahora - 180 * MIN]));
  const pendientes = s.turnos;
  for (const turno of pendientes) {
    const opciones = MODULOS.filter((m) => m.servicios.includes(turno.servicio));
    const m = opciones.reduce((a, b) => (libre.get(a.numero)! <= libre.get(b.numero)! ? a : b));
    const llamado = Math.max(turno.creado + 0.5 * MIN, libre.get(m.numero)!);
    if (llamado > ahora - MIN) continue;

    const dura = (3 + r() * (turno.servicio === "A" ? 12 : 6)) * MIN;
    Object.assign<Turno, Partial<Turno>>(turno, { modulo: m.numero, llamado, llamadas: 1 });
    if (llamado + dura > ahora) {
      turno.estado = "atendiendo";
      turno.inicio = llamado + 0.6 * MIN;
      s.enModulo[m.numero] = turno.id;
      libre.set(m.numero, Number.POSITIVE_INFINITY);
    } else if (r() < 0.05) {
      turno.estado = "ausente";
      turno.fin = llamado + 2 * MIN;
      libre.set(m.numero, turno.fin);
    } else {
      turno.estado = "atendido";
      turno.inicio = llamado + 0.6 * MIN;
      turno.fin = llamado + dura;
      libre.set(m.numero, turno.fin);
    }
  }

  const ultimo = [...s.turnos].filter((x) => x.llamado).sort((a, b) => b.llamado! - a.llamado!)[0];
  if (ultimo) s.anuncio = { turnoId: ultimo.id, modulo: ultimo.modulo!, vez: 0 };
  return s;
}
