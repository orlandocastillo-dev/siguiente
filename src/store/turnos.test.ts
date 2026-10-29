import { describe, expect, it } from "vitest";
import reducer, { empezar, estadoVacio, llamar, noSePresento, rellamar, siguientePara, terminar, tomarTurno, type EstadoTurnos } from "./turnos";
import type { ServicioId } from "../dominio/oficina";

const MIN = 60_000;
const BASE = new Date(2026, 9, 29, 8, 0).getTime();

// Saca turnos con horas fijas para que el orden de llegada no dependa del reloj
function conTurnos(...servicios: ServicioId[]) {
  return servicios.reduce<EstadoTurnos>(
    (s, servicio, i) => reducer(s, { type: tomarTurno.type, payload: { servicio, id: `t${i + 1}`, en: BASE + i * MIN } }),
    estadoVacio("2026-10-29"),
  );
}

const turno = (s: EstadoTurnos, id: string) => s.turnos.find((t) => t.id === id)!;

describe("tomar turno", () => {
  it("numera cada servicio por aparte", () => {
    const s = conTurnos("C", "C", "A", "P");
    expect(s.turnos.map((t) => t.codigo)).toEqual(["C-001", "C-002", "A-001", "P-001"]);
    expect(s.turnos.every((t) => t.estado === "espera")).toBe(true);
  });
});

describe("siguiente para un módulo", () => {
  it("da prioridad al preferencial aunque haya llegado después", () => {
    const s = conTurnos("C", "C", "P");
    expect(siguientePara(s, 2)?.codigo).toBe("P-001");
  });

  it("un módulo sin preferencial sigue el orden de llegada", () => {
    const s = conTurnos("C", "P", "C");
    expect(siguientePara(s, 1)?.codigo).toBe("C-001");
  });

  it("solo ofrece turnos de los servicios que atiende el módulo", () => {
    const s = conTurnos("A", "R");
    expect(siguientePara(s, 1)).toBeUndefined();
    expect(siguientePara(s, 4)?.codigo).toBe("A-001");
  });
});

describe("llamar", () => {
  it("marca el turno, lo asigna al módulo y deja el anuncio para la sala", () => {
    let s = conTurnos("C");
    s = reducer(s, llamar({ modulo: 1, turnoId: "t1", en: BASE + 5 * MIN }));
    expect(turno(s, "t1")).toMatchObject({ estado: "llamado", modulo: 1, llamadas: 1, llamado: BASE + 5 * MIN });
    expect(s.enModulo[1]).toBe("t1");
    expect(s.anuncio).toEqual({ turnoId: "t1", modulo: 1, vez: 1 });
  });

  it("no llama dos veces al mismo turno desde dos ventanillas", () => {
    let s = conTurnos("C");
    s = reducer(s, llamar({ modulo: 1, turnoId: "t1", en: BASE + MIN }));
    s = reducer(s, llamar({ modulo: 2, turnoId: "t1", en: BASE + MIN }));
    expect(turno(s, "t1").modulo).toBe(1);
    expect(s.enModulo[2]).toBeNull();
    expect(s.anuncio?.vez).toBe(1);
  });

  it("cierra el turno anterior del módulo al llamar a otro", () => {
    let s = conTurnos("C", "C");
    s = reducer(s, llamar({ modulo: 1, turnoId: "t1", en: BASE + 2 * MIN }));
    s = reducer(s, llamar({ modulo: 1, turnoId: "t2", en: BASE + 6 * MIN }));
    expect(turno(s, "t1")).toMatchObject({ estado: "atendido", inicio: BASE + 2 * MIN, fin: BASE + 6 * MIN });
    expect(s.enModulo[1]).toBe("t2");
  });

  it("volver a llamar suma una llamada y repite el anuncio", () => {
    let s = conTurnos("C");
    s = reducer(s, llamar({ modulo: 1, turnoId: "t1", en: BASE }));
    s = reducer(s, rellamar({ modulo: 1, en: BASE + MIN }));
    expect(turno(s, "t1").llamadas).toBe(2);
    expect(s.anuncio?.vez).toBe(2);
  });
});

describe("atender", () => {
  it("guarda inicio y fin de la atención", () => {
    let s = conTurnos("A");
    s = reducer(s, llamar({ modulo: 3, turnoId: "t1", en: BASE + MIN }));
    s = reducer(s, empezar({ modulo: 3, en: BASE + 2 * MIN }));
    s = reducer(s, terminar({ modulo: 3, en: BASE + 10 * MIN }));
    expect(turno(s, "t1")).toMatchObject({ estado: "atendido", inicio: BASE + 2 * MIN, fin: BASE + 10 * MIN });
    expect(s.enModulo[3]).toBeNull();
  });

  it("si no se presenta queda como ausente y libera el módulo", () => {
    let s = conTurnos("R");
    s = reducer(s, llamar({ modulo: 5, turnoId: "t1", en: BASE }));
    s = reducer(s, noSePresento({ modulo: 5, en: BASE + 3 * MIN }));
    expect(turno(s, "t1").estado).toBe("ausente");
    expect(s.enModulo[5]).toBeNull();
    expect(siguientePara(s, 5)).toBeUndefined();
  });
});
