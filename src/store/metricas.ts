import { MODULOS, ORDEN_SERVICIOS, SERVICIOS, type ServicioId } from "../dominio/oficina";
import type { EstadoTurnos, Turno } from "./turnos";

const MIN = 60_000;
const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export const enEspera = (s: EstadoTurnos, servicio?: ServicioId) =>
  s.turnos.filter((t) => t.estado === "espera" && (!servicio || t.servicio === servicio));

/** Minutos que esperaría alguien que saque turno ahora. */
export function esperaEstimada(s: EstadoTurnos, servicio: ServicioId) {
  const modulos = MODULOS.filter((m) => m.servicios.includes(servicio)).length || 1;
  const delante = enEspera(s, servicio).length;
  return Math.ceil((delante * SERVICIOS[servicio].minutos) / modulos);
}

export const ultimosLlamados = (s: EstadoTurnos, cuantos: number) =>
  s.turnos
    .filter((t) => t.llamado !== undefined && t.estado !== "espera")
    .sort((a, b) => b.llamado! - a.llamado!)
    .slice(0, cuantos);

const espera = (t: Turno) => (t.llamado! - t.creado) / MIN;
const atencion = (t: Turno) => (t.fin! - (t.inicio ?? t.llamado!)) / MIN;

export function metricas(s: EstadoTurnos) {
  const llamados = s.turnos.filter((t) => t.llamado !== undefined);
  const atendidos = s.turnos.filter((t) => t.estado === "atendido" && t.fin !== undefined);

  const porServicio = ORDEN_SERVICIOS.map((id) => {
    const delServicio = s.turnos.filter((t) => t.servicio === id);
    return {
      servicio: SERVICIOS[id],
      turnos: delServicio.length,
      enEspera: delServicio.filter((t) => t.estado === "espera").length,
      espera: promedio(delServicio.filter((t) => t.llamado !== undefined).map(espera)),
      atencion: promedio(delServicio.filter((t) => t.estado === "atendido" && t.fin !== undefined).map(atencion)),
    };
  });

  const porModulo = MODULOS.map((m) => {
    const suyos = atendidos.filter((t) => t.modulo === m.numero);
    return { numero: m.numero, servicios: m.servicios, atendidos: suyos.length, atencion: promedio(suyos.map(atencion)) };
  });

  const porHora = new Map<number, number>();
  for (const t of s.turnos) {
    const h = new Date(t.creado).getHours();
    porHora.set(h, (porHora.get(h) ?? 0) + 1);
  }
  const horas = [...porHora.keys()];
  const desde = horas.length ? Math.min(...horas) : 7;
  const hasta = horas.length ? Math.max(...horas) : 12;
  const llegadas = Array.from({ length: hasta - desde + 1 }, (_, i) => ({ hora: desde + i, turnos: porHora.get(desde + i) ?? 0 }));

  return {
    total: s.turnos.length,
    atendidos: atendidos.length,
    ausentes: s.turnos.filter((t) => t.estado === "ausente").length,
    enEspera: enEspera(s).length,
    espera: promedio(llamados.map(espera)),
    esperaMaxima: llamados.length ? Math.max(...llamados.map(espera)) : 0,
    atencion: promedio(atendidos.map(atencion)),
    porServicio,
    porModulo,
    llegadas,
  };
}

export const minutos = (m: number) => (m < 1 ? "menos de 1 min" : `${Math.round(m)} min`);
