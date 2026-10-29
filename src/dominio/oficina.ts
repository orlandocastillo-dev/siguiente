export type ServicioId = "C" | "A" | "R" | "P";

export interface Servicio {
  id: ServicioId;
  nombre: string;
  detalle: string;
  /** Lo que dura en promedio una atención, para estimar la espera. */
  minutos: number;
}

export const SERVICIOS: Record<ServicioId, Servicio> = {
  C: { id: "C", nombre: "Caja", detalle: "Pagos, abonos y recibos", minutos: 4 },
  A: { id: "A", nombre: "Asesoría", detalle: "Dudas, trámites y cambios de plan", minutos: 9 },
  R: { id: "R", nombre: "Radicación", detalle: "Entrega de documentos y solicitudes", minutos: 6 },
  P: { id: "P", nombre: "Preferencial", detalle: "Adultos mayores, embarazadas y personas con discapacidad", minutos: 6 },
};

export const ORDEN_SERVICIOS: ServicioId[] = ["C", "A", "R", "P"];

export interface Modulo {
  numero: number;
  servicios: ServicioId[];
}

// Cada módulo atiende ciertos servicios; los que tienen preferencial lo llaman primero
export const MODULOS: Modulo[] = [
  { numero: 1, servicios: ["C"] },
  { numero: 2, servicios: ["C", "P"] },
  { numero: 3, servicios: ["A", "P"] },
  { numero: 4, servicios: ["A"] },
  { numero: 5, servicios: ["R", "P"] },
];

export const OFICINA = "Oficina de Atención al Usuario, Sede Centro";

export const modulo = (n: number) => MODULOS.find((m) => m.numero === n);

export const codigoTurno = (servicio: ServicioId, n: number) => `${servicio}-${String(n).padStart(3, "0")}`;
