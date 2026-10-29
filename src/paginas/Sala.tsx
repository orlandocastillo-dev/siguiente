import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Logo, Reloj } from "../componentes/Comunes";
import { Paleta } from "../componentes/Paleta";
import { OFICINA, ORDEN_SERVICIOS, SERVICIOS } from "../dominio/oficina";
import { activarSonido, anunciar } from "../lib/anunciar";
import { useDespacho, useEstado } from "../store";
import { diaDeEjemplo } from "../store/ejemplo";
import { enEspera, esperaEstimada, ultimosLlamados } from "../store/metricas";
import { reemplazar } from "../store/turnos";

/** La pantalla grande de la sala: el último llamado, los anteriores y cuánto se espera por servicio. */
export function Sala() {
  const despachar = useDespacho();
  const estado = useEstado((s) => s.turnos);
  const [sonido, setSonido] = useState(false);
  const [destello, setDestello] = useState(0);
  const visto = useRef(estado.anuncio?.vez ?? 0);

  const anuncio = estado.anuncio;
  const llamado = anuncio ? estado.turnos.find((t) => t.id === anuncio.turnoId) : undefined;
  const anteriores = ultimosLlamados(estado, 7).filter((t) => t.id !== llamado?.id).slice(0, 6);

  useEffect(() => {
    if (!anuncio || anuncio.vez === visto.current) return;
    visto.current = anuncio.vez;
    setDestello((n) => n + 1);
    if (sonido && llamado) anunciar(llamado.codigo, anuncio.modulo);
  }, [anuncio, llamado, sonido]);

  return (
    <div className="sala">
      <header className="sala__cabeza">
        <Logo claro />
        <p className="sala__sede">{OFICINA}</p>
        <Reloj />
      </header>

      <main className="sala__cuerpo">
        <section className={`llamado${destello ? " llamado--nuevo" : ""}`} key={destello} aria-live="assertive">
          {llamado ? (
            <>
              <p className="llamado__rotulo">Turno</p>
              <Paleta texto={llamado.codigo} className="paleta--grande" />
              <p className="llamado__flecha" aria-hidden="true">
                <svg viewBox="0 0 48 24">
                  <path d="M2 12h40M32 3l10 9-10 9" />
                </svg>
              </p>
              <p className="llamado__rotulo">Módulo</p>
              <Paleta texto={String(anuncio!.modulo)} className="paleta--grande paleta--modulo" />
              <p className="llamado__servicio">{SERVICIOS[llamado.servicio].nombre}</p>
            </>
          ) : (
            <div className="llamado__vacio">
              <p>Todavía no se ha llamado a nadie hoy.</p>
              <div className="llamado__botones">
                <button className="boton boton--primario" onClick={() => despachar(reemplazar(diaDeEjemplo()))}>
                  Cargar una mañana de ejemplo
                </button>
                <Link className="boton" to="/kiosco" target="_blank">
                  Abrir el kiosco
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="anteriores">
          <h2>Llamados anteriores</h2>
          <ol>
            {anteriores.map((t) => (
              <li key={t.id}>
                <span className="anteriores__codigo">{t.codigo}</span>
                <span className="anteriores__modulo">Módulo {t.modulo}</span>
              </li>
            ))}
            {anteriores.length === 0 && <li className="anteriores__nada">Aquí van saliendo los turnos ya llamados.</li>}
          </ol>
        </section>
      </main>

      <footer className="sala__pie">
        {ORDEN_SERVICIOS.map((id) => {
          const n = enEspera(estado, id).length;
          return (
            <div key={id} className="espera">
              <span className={`etiqueta etiqueta--${id}`}>{id}</span>
              <span className="espera__nombre">{SERVICIOS[id].nombre}</span>
              <span className="espera__dato">{n === 0 ? "Sin fila" : `${n} en espera, unos ${esperaEstimada(estado, id)} min`}</span>
            </div>
          );
        })}
      </footer>

      {!sonido && (
        <button
          className="sala__sonido"
          onClick={() => {
            activarSonido();
            setSonido(true);
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11" />
          </svg>
          Activar el sonido de los llamados
        </button>
      )}
    </div>
  );
}
