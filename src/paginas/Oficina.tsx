import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BarraPantallas } from "../componentes/Comunes";
import { Paleta } from "../componentes/Paleta";
import { MODULOS, ORDEN_SERVICIOS, SERVICIOS, type ServicioId } from "../dominio/oficina";
import { activarSonido, anunciar } from "../lib/anunciar";
import { empezarDia, llamarSiguiente, useDespacho, useEstado } from "../store";
import { enEspera, ultimosLlamados } from "../store/metricas";
import { rellamar, siguientePara, terminar, tomarTurno } from "../store/turnos";

/** Las tres pantallas en una sola vista, para entender el sistema sin saltar entre pestañas. */
export function Oficina() {
  const despachar = useDespacho();
  const estado = useEstado((s) => s.turnos);
  const [numero, setNumero] = useState(2);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [sonido, setSonido] = useState(false);
  const visto = useRef(estado.anuncio?.vez ?? 0);
  const [destello, setDestello] = useState(0);

  const modulo = MODULOS.find((m) => m.numero === numero)!;
  const actual = estado.turnos.find((t) => t.id === estado.enModulo[numero]);
  const siguiente = siguientePara(estado, numero);
  const fila = enEspera(estado).filter((t) => modulo.servicios.includes(t.servicio));
  const anuncio = estado.anuncio;
  const llamado = anuncio ? estado.turnos.find((t) => t.id === anuncio.turnoId) : undefined;
  const anteriores = ultimosLlamados(estado, 4).filter((t) => t.id !== llamado?.id).slice(0, 3);

  const paso = actual ? 3 : siguiente ? 2 : 1;
  const guia = {
    1: "Toque un servicio en el kiosco para sacar un turno.",
    2: `Ahora el módulo ${numero} lo llama: toque “Llamar al siguiente”.`,
    3: "La sala lo anunció. Termine la atención y llame al siguiente, o saque otro turno.",
  }[paso];

  useEffect(() => {
    if (!anuncio || anuncio.vez === visto.current) return;
    visto.current = anuncio.vez;
    setDestello((n) => n + 1);
    if (sonido && llamado) anunciar(llamado.codigo, anuncio.modulo);
  }, [anuncio, llamado, sonido]);

  function sacar(servicio: ServicioId) {
    const accion = despachar(tomarTurno(servicio));
    setUltimo(accion.payload.id);
    // Si el módulo escogido no atiende ese servicio, se pasa a uno que sí, para no quedar sin nada que llamar
    if (!modulo.servicios.includes(servicio)) setNumero(MODULOS.find((m) => m.servicios.includes(servicio))!.numero);
  }

  const en = () => ({ modulo: numero, en: Date.now() });
  const tiquete = estado.turnos.find((t) => t.id === ultimo);

  return (
    <div className="pantalla oficina">
      <BarraPantallas />
      <main className="oficina__cuerpo">
        <header className="oficina__cabeza">
          <div>
            <p className="sobre">Toda la oficina en una pantalla</p>
            <p className="oficina__guia" aria-live="polite">
              <b>{paso}</b>
              {guia}
            </p>
          </div>
          <button className="boton boton--suave" onClick={() => despachar(empezarDia())}>
            Empezar en cero
          </button>
        </header>

        <div className="oficina__columnas">
          <section className={`caja-oficina${paso === 1 ? " caja-oficina--activa" : ""}`}>
            <h2>
              <span>1</span> Kiosco
            </h2>
            <p className="caja-oficina__ayuda">La persona escoge a qué viene.</p>
            <div className="mini-kiosco">
              {ORDEN_SERVICIOS.map((id) => (
                <button key={id} onClick={() => sacar(id)}>
                  <span className={`etiqueta etiqueta--${id}`}>{id}</span>
                  <span className="mini-kiosco__nombre">{SERVICIOS[id].nombre}</span>
                  <span className="mini-kiosco__fila">{enEspera(estado, id).length} en fila</span>
                </button>
              ))}
            </div>
            {tiquete && (
              <p className="mini-tiquete">
                Turno entregado <b>{tiquete.codigo}</b>
              </p>
            )}
          </section>

          <section className={`caja-oficina${paso === 2 ? " caja-oficina--activa" : ""}`}>
            <h2>
              <span>2</span> Ventanilla
            </h2>
            <p className="caja-oficina__ayuda">El funcionario llama desde su módulo.</p>
            <div className="mini-modulos" role="group" aria-label="Módulo">
              {MODULOS.map((m) => (
                <button key={m.numero} aria-pressed={m.numero === numero} onClick={() => setNumero(m.numero)}>
                  {m.numero}
                </button>
              ))}
            </div>
            <p className="mini-modulos__atiende">Módulo {numero}: {modulo.servicios.map((s) => SERVICIOS[s].nombre).join(" y ")}</p>

            <div className="mini-puesto">
              {actual ? (
                <>
                  <p className="mini-puesto__estado">{actual.estado === "llamado" ? "Llamando a" : "Atendiendo a"}</p>
                  <p className="mini-puesto__codigo">{actual.codigo}</p>
                  <div className="mini-puesto__acciones">
                    <button className="boton boton--primario" onClick={() => despachar(terminar(en()))}>
                      Terminar
                    </button>
                    {actual.estado === "llamado" && (
                      <button className="boton" onClick={() => despachar(rellamar(en()))}>
                        Volver a llamar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="mini-puesto__estado">Módulo libre</p>
              )}
            </div>

            <button className="llamar llamar--mini" onClick={() => despachar(llamarSiguiente(numero))} disabled={!siguiente}>
              <span>Llamar al siguiente</span>
              <small>{siguiente ? `${siguiente.codigo}, ${SERVICIOS[siguiente.servicio].nombre}` : "Nadie en fila para este módulo"}</small>
            </button>
            {fila.length > 1 && <p className="caja-oficina__ayuda">Detrás vienen {fila.length - 1} más.</p>}
          </section>

          <section className={`caja-oficina caja-oficina--sala${paso === 3 ? " caja-oficina--activa" : ""}`}>
            <h2>
              <span>3</span> Sala de espera
            </h2>
            <div className={`mini-sala${destello ? " llamado--nuevo" : ""}`} key={destello} aria-live="assertive">
              {llamado ? (
                <>
                  <Paleta texto={llamado.codigo} className="paleta--mini" />
                  <p className="mini-sala__modulo">
                    Módulo <b>{anuncio!.modulo}</b>
                  </p>
                </>
              ) : (
                <p className="mini-sala__vacio">Aquí aparece cada turno que llaman.</p>
              )}
            </div>
            {anteriores.length > 0 && (
              <ol className="mini-sala__antes">
                {anteriores.map((t) => (
                  <li key={t.id}>
                    {t.codigo} <span>Módulo {t.modulo}</span>
                  </li>
                ))}
              </ol>
            )}
            <button
              className="mini-sala__sonido"
              aria-pressed={sonido}
              onClick={() => {
                if (!sonido) activarSonido();
                setSonido(!sonido);
              }}
            >
              {sonido ? "Sonido encendido" : "Encender el sonido"}
            </button>
          </section>
        </div>

        <p className="nota oficina__nota">
          En una oficina de verdad cada pantalla va en un equipo distinto. Para verlo así, abra el <Link to="/kiosco" target="_blank">kiosco</Link>, la{" "}
          <Link to="/ventanilla" target="_blank">ventanilla</Link> y la <Link to="/sala" target="_blank">sala</Link> en pestañas separadas: se mueven
          juntas.
        </p>
      </main>
    </div>
  );
}
