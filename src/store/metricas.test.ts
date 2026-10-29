import { describe, expect, it } from "vitest";
import reducer, { estadoVacio, llamar, noSePresento, terminar, tomarTurno, type EstadoTurnos } from "./turnos";
import { esperaEstimada, metricas, minutos, ultimosLlamados } from "./metricas";
import type { ServicioId } from "../dominio/oficina";

const MIN = 60_000;
const BASE = new Date(2026, 9, 29, 8, 0).getTime();

const sacar = (s: EstadoTurnos, servicio: ServicioId, id: string, en: number) =>
  reducer(s, { type: tomarTurno.type, payload: { servicio, id, en } });

describe("espera estimada", () => {
  it("reparte la fila entre los módulos que atienden el servicio", () => {
    let s = estadoVacio("2026-10-29");
    for (let i = 0; i < 3; i++) s = sacar(s, "C", `c${i}`, BASE + i);
    // 3 personas de caja, 4 min cada una, 2 módulos de caja
    expect(esperaEstimada(s, "C")).toBe(6);
    expect(esperaEstimada(s, "A")).toBe(0);
  });
});

describe("métricas del día", () => {
  // C llega 8:00, lo llaman 8:10 y sale 8:14. A llega 8:05 y no se presenta. R sigue en espera.
  let s = estadoVacio("2026-10-29");
  s = sacar(s, "C", "c", BASE);
  s = sacar(s, "A", "a", BASE + 5 * MIN);
  s = sacar(s, "R", "r", BASE + 70 * MIN);
  s = reducer(s, llamar({ modulo: 1, turnoId: "c", en: BASE + 10 * MIN }));
  s = reducer(s, terminar({ modulo: 1, en: BASE + 14 * MIN }));
  s = reducer(s, llamar({ modulo: 4, turnoId: "a", en: BASE + 25 * MIN }));
  s = reducer(s, noSePresento({ modulo: 4, en: BASE + 27 * MIN }));
  const m = metricas(s);

  it("cuenta turnos por estado", () => {
    expect(m).toMatchObject({ total: 3, atendidos: 1, ausentes: 1, enEspera: 1 });
  });

  it("promedia la espera de los llamados y la atención de los atendidos", () => {
    expect(m.espera).toBe(15);
    expect(m.esperaMaxima).toBe(20);
    expect(m.atencion).toBe(4);
  });

  it("agrupa por módulo y por hora de llegada", () => {
    expect(m.porModulo.find((x) => x.numero === 1)).toMatchObject({ atendidos: 1, atencion: 4 });
    expect(m.llegadas).toEqual([
      { hora: 8, turnos: 2 },
      { hora: 9, turnos: 1 },
    ]);
  });

  it("los últimos llamados salen del más reciente al más viejo", () => {
    expect(ultimosLlamados(s, 5).map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("un día vacío no rompe nada", () => {
    expect(metricas(estadoVacio())).toMatchObject({ total: 0, espera: 0, esperaMaxima: 0, atencion: 0 });
  });
});

describe("minutos", () => {
  it("redondea y evita decir cero", () => {
    expect(minutos(0.4)).toBe("menos de 1 min");
    expect(minutos(6.6)).toBe("7 min");
  });
});
