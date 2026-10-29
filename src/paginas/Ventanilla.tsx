import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BarraPantallas, cronometro, hora, useAhora } from "../componentes/Comunes";
import { MODULOS, SERVICIOS, modulo as buscarModulo } from "../dominio/oficina";
import { llamarSiguiente, useDespacho, useEstado } from "../store";
import { minutos } from "../store/metricas";
import { empezar, noSePresento, rellamar, siguientePara, terminar } from "../store/turnos";

export function Ventanilla() {
  const [params, setParams] = useSearchParams();
  const numero = Number(params.get("m")) || 0;
  const m = buscarModulo(numero);

  if (!m) {
    return (
      <div className="pantalla ventanilla">
        <BarraPantallas />
        <main className="elegir">
          <p className="sobre">Ventanilla</p>
          <h1>¿En qué módulo está?</h1>
          <div className="elegir__lista">
            {MODULOS.map((x) => (
              <button key={x.numero} className="elegir__modulo" onClick={() => setParams({ m: String(x.numero) })}>
                <b>{x.numero}</b>
                <span>{x.servicios.map((s) => SERVICIOS[s].nombre).join(" y ")}</span>
              </button>
            ))}
          </div>
          <p className="nota">Abra la sala de espera en otra pestaña o en otro monitor: cada llamado sale allá al instante.</p>
        </main>
      </div>
    );
  }

  return <Puesto numero={m.numero} cambiar={() => setParams({})} />;
}

function Puesto({ numero, cambiar }: { numero: number; cambiar: () => void }) {
  const despachar = useDespacho();
  const ahora = useAhora(1000);
  const estado = useEstado((s) => s.turnos);
  const m = buscarModulo(numero)!;
  const actual = estado.turnos.find((t) => t.id === estado.enModulo[numero]);
  const siguiente = siguientePara(estado, numero);
  const fila = estado.turnos
    .filter((t) => t.estado === "espera" && m.servicios.includes(t.servicio))
    .sort((a, b) => (a.servicio === "P" ? -1 : 0) - (b.servicio === "P" ? -1 : 0) || a.creado - b.creado);
  const atendidosHoy = estado.turnos.filter((t) => t.modulo === numero && t.estado === "atendido");

  const en = () => ({ modulo: numero, en: Date.now() });

  // N llama al siguiente, R vuelve a llamar, sin tener que buscar el botón
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "n") despachar(llamarSiguiente(numero));
      if (e.key.toLowerCase() === "r") despachar(rellamar({ modulo: numero, en: Date.now() }));
    };
    addEventListener("keydown", tecla);
    return () => removeEventListener("keydown", tecla);
  }, [despachar, numero]);

  return (
    <div className="pantalla ventanilla">
      <BarraPantallas />
      <main className="puesto">
        <section className="puesto__actual">
          <header className="puesto__cabeza">
            <div>
              <p className="sobre">Módulo</p>
              <p className="puesto__numero">{numero}</p>
            </div>
            <div className="puesto__info">
              <p>{m.servicios.map((s) => SERVICIOS[s].nombre).join(", ")}</p>
              <button className="enlace" onClick={cambiar}>
                Cambiar de módulo
              </button>
            </div>
          </header>

          {actual ? (
            <div className={`atendiendo atendiendo--${actual.estado}`}>
              <p className="atendiendo__estado">{actual.estado === "llamado" ? `Llamando${actual.llamadas > 1 ? ` (${actual.llamadas}.ª vez)` : ""}` : "En atención"}</p>
              <p className="atendiendo__codigo">{actual.codigo}</p>
              <p className="atendiendo__servicio">{SERVICIOS[actual.servicio].nombre}</p>
              <dl className="atendiendo__tiempos">
                <div>
                  <dt>Esperó</dt>
                  <dd>{minutos((actual.llamado! - actual.creado) / 60000)}</dd>
                </div>
                <div>
                  <dt>{actual.estado === "llamado" ? "Llamado hace" : "Lleva"}</dt>
                  <dd className="cifra">{cronometro(actual.estado === "llamado" ? actual.llamado! : actual.inicio!, ahora)}</dd>
                </div>
              </dl>
              <div className="atendiendo__acciones">
                {actual.estado === "llamado" ? (
                  <>
                    <button className="boton boton--primario" onClick={() => despachar(empezar(en()))}>
                      Ya llegó
                    </button>
                    <button className="boton" onClick={() => despachar(rellamar(en()))}>
                      Volver a llamar
                    </button>
                    <button className="boton boton--suave" onClick={() => despachar(noSePresento(en()))}>
                      No se presentó
                    </button>
                  </>
                ) : (
                  <button className="boton boton--primario" onClick={() => despachar(terminar(en()))}>
                    Terminar atención
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="atendiendo atendiendo--libre">
              <p className="atendiendo__estado">Módulo libre</p>
              <p className="atendiendo__vacio">{siguiente ? `Sigue ${siguiente.codigo}` : "No hay nadie esperando"}</p>
            </div>
          )}

          <button className="llamar" onClick={() => despachar(llamarSiguiente(numero))} disabled={!siguiente}>
            <span>Llamar al siguiente</span>
            <small>{siguiente ? `${siguiente.codigo}, ${SERVICIOS[siguiente.servicio].nombre}` : "Nadie en fila"}</small>
            <kbd>N</kbd>
          </button>
        </section>

        <aside className="puesto__fila">
          <h2>
            En fila para este módulo <span>{fila.length}</span>
          </h2>
          {fila.length === 0 ? (
            <p className="nota">Cuando alguien saque turno en el kiosco, aparece aquí.</p>
          ) : (
            <ol className="fila">
              {fila.slice(0, 12).map((t, i) => (
                <li key={t.id} className={i === 0 ? "fila__primero" : ""}>
                  <span className={`etiqueta etiqueta--${t.servicio}`}>{t.codigo}</span>
                  <span className="fila__servicio">{SERVICIOS[t.servicio].nombre}</span>
                  <span className="fila__hora">{hora(t.creado)}</span>
                  <span className="fila__espera cifra">{cronometro(t.creado, ahora)}</span>
                </li>
              ))}
            </ol>
          )}
          {fila.length > 12 && <p className="nota">Y {fila.length - 12} más.</p>}

          <div className="puesto__hoy">
            <div>
              <b className="cifra">{atendidosHoy.length}</b>
              <span>atendidos hoy</span>
            </div>
            <div>
              <b className="cifra">
                {atendidosHoy.length ? Math.round(atendidosHoy.reduce((a, t) => a + (t.fin! - (t.inicio ?? t.llamado!)), 0) / atendidosHoy.length / 60000) : 0}
              </b>
              <span>min por persona</span>
            </div>
          </div>
          <p className="nota">Atajos: N llama al siguiente, R vuelve a llamar.</p>
        </aside>
      </main>
    </div>
  );
}
