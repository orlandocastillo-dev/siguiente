import { useEffect, useState } from "react";
import { BarraPantallas, hora } from "../componentes/Comunes";
import { OFICINA, ORDEN_SERVICIOS, SERVICIOS, type ServicioId } from "../dominio/oficina";
import { store, useDespacho, useEstado } from "../store";
import { enEspera, esperaEstimada } from "../store/metricas";
import { tomarTurno, type Turno } from "../store/turnos";

interface Tiquete {
  turno: Turno;
  delante: number;
  minutos: number;
}

const ICONOS: Record<ServicioId, string> = {
  C: "M3 7h18v10H3zM3 10h18M7 14h3",
  A: "M4 5h16v10H9l-5 4zM8 9h8M8 12h5",
  R: "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 15h5",
  P: "M12 4a2 2 0 110 4 2 2 0 010-4zM10 10h4l1 5h-2l-1 5M10 10l-2 6h3",
};

export function Kiosco() {
  const despachar = useDespacho();
  const fila = useEstado((s) => s.turnos);
  const [tiquete, setTiquete] = useState<Tiquete | null>(null);

  // El tiquete se queda en pantalla unos segundos y vuelve al menú
  useEffect(() => {
    if (!tiquete) return;
    const id = setTimeout(() => setTiquete(null), 9000);
    return () => clearTimeout(id);
  }, [tiquete]);

  function sacar(servicio: ServicioId) {
    const antes = store.getState().turnos;
    const delante = enEspera(antes, servicio).length;
    const minutos = esperaEstimada(antes, servicio);
    const accion = despachar(tomarTurno(servicio));
    const turno = store.getState().turnos.turnos.find((t) => t.id === accion.payload.id)!;
    setTiquete({ turno, delante, minutos });
  }

  return (
    <div className="pantalla kiosco">
      <BarraPantallas />
      <main className="kiosco__cuerpo">
        <div className="kiosco__saludo">
          <p className="sobre">{OFICINA}</p>
          <h1>Buenos días. ¿A qué viene hoy?</h1>
          <p className="kiosco__ayuda">Toque una opción y reciba su turno. Lo llamaremos en la pantalla y por voz.</p>
        </div>

        <div className="kiosco__opciones">
          {ORDEN_SERVICIOS.map((id) => {
            const s = SERVICIOS[id];
            const esperan = enEspera(fila, id).length;
            const min = esperaEstimada(fila, id);
            return (
              <button key={id} className={`opcion opcion--${id}`} onClick={() => sacar(id)} disabled={!!tiquete}>
                <span className="opcion__letra">{id}</span>
                <svg className="opcion__icono" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={ICONOS[id]} />
                </svg>
                <span className="opcion__nombre">{s.nombre}</span>
                <span className="opcion__detalle">{s.detalle}</span>
                <span className="opcion__espera">
                  {esperan === 0 ? "Sin fila" : `${esperan} ${esperan === 1 ? "persona" : "personas"} en espera`}
                  {esperan > 0 && <b> unos {min} min</b>}
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {tiquete && (
        <div className="impresora" role="dialog" aria-label={`Su turno es ${tiquete.turno.codigo}`} onClick={() => setTiquete(null)}>
          <div className="impresora__ranura" />
          <article className="tiquete">
            <p className="tiquete__sede">{OFICINA}</p>
            <p className="tiquete__rotulo">Su turno</p>
            <p className="tiquete__codigo">{tiquete.turno.codigo}</p>
            <p className="tiquete__servicio">{SERVICIOS[tiquete.turno.servicio].nombre}</p>
            <dl className="tiquete__datos">
              <div>
                <dt>Antes de usted</dt>
                <dd>{tiquete.delante}</dd>
              </div>
              <div>
                <dt>Espera aprox.</dt>
                <dd>{tiquete.delante === 0 ? "Ya casi" : `${tiquete.minutos} min`}</dd>
              </div>
            </dl>
            <p className="tiquete__pie">
              Esté pendiente de la pantalla de la sala. Sacado a las {hora(tiquete.turno.creado)}
            </p>
            <p className="tiquete__corte" aria-hidden="true" />
            <button className="boton boton--claro" onClick={() => setTiquete(null)}>
              Listo
            </button>
          </article>
        </div>
      )}
    </div>
  );
}
