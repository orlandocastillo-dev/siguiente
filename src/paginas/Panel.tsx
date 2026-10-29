import { BarraPantallas } from "../componentes/Comunes";
import { SERVICIOS } from "../dominio/oficina";
import { empezarDia, useDespacho, useEstado } from "../store";
import { diaDeEjemplo } from "../store/ejemplo";
import { metricas, minutos } from "../store/metricas";
import { reemplazar } from "../store/turnos";

export function Panel() {
  const despachar = useDespacho();
  const estado = useEstado((s) => s.turnos);
  const m = metricas(estado);
  const maxHora = Math.max(1, ...m.llegadas.map((h) => h.turnos));
  const maxModulo = Math.max(1, ...m.porModulo.map((x) => x.atendidos));

  return (
    <div className="pantalla panel">
      <BarraPantallas />
      <main className="panel__cuerpo">
        <header className="panel__cabeza">
          <div>
            <p className="sobre">Panel del día</p>
            <h1>{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</h1>
          </div>
          <div className="panel__acciones">
            <button className="boton" onClick={() => despachar(reemplazar(diaDeEjemplo()))}>
              Cargar mañana de ejemplo
            </button>
            <button
              className="boton boton--suave"
              onClick={() => {
                if (confirm("¿Empezar el día en cero? Se borran los turnos de hoy en este navegador.")) despachar(empezarDia());
              }}
            >
              Empezar en cero
            </button>
          </div>
        </header>

        <section className="cifras">
          <div className="cifra-caja">
            <span>Turnos</span>
            <b className="cifra">{m.total}</b>
            <small>{m.enEspera} esperando ahora</small>
          </div>
          <div className="cifra-caja">
            <span>Atendidos</span>
            <b className="cifra">{m.atendidos}</b>
            <small>{m.ausentes} no se presentaron</small>
          </div>
          <div className={`cifra-caja${m.espera > 15 ? " cifra-caja--alerta" : ""}`}>
            <span>Espera promedio</span>
            <b className="cifra">{Math.round(m.espera)}<i>min</i></b>
            <small>La más larga: {minutos(m.esperaMaxima)}</small>
          </div>
          <div className="cifra-caja">
            <span>Atención promedio</span>
            <b className="cifra">{Math.round(m.atencion)}<i>min</i></b>
            <small>Desde que llega al módulo</small>
          </div>
        </section>

        <div className="panel__grilla">
          <section className="tarjeta">
            <h2>Llegadas por hora</h2>
            {m.total === 0 ? (
              <p className="nota">Todavía no hay turnos hoy.</p>
            ) : (
              <div className="barras" role="img" aria-label="Turnos sacados en cada hora del día">
                {m.llegadas.map((h) => (
                  <div key={h.hora} className="barras__col">
                    <span className="barras__valor cifra">{h.turnos || ""}</span>
                    <span className="barras__barra" style={{ height: `${(h.turnos / maxHora) * 100}%` }} />
                    <span className="barras__hora">{h.hora > 12 ? h.hora - 12 : h.hora}{h.hora >= 12 ? "p" : "a"}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="tarjeta">
            <h2>Por módulo</h2>
            <ul className="modulos">
              {m.porModulo.map((x) => (
                <li key={x.numero}>
                  <span className="modulos__num">{x.numero}</span>
                  <span className="modulos__barra">
                    <i style={{ width: `${(x.atendidos / maxModulo) * 100}%` }} />
                  </span>
                  <span className="modulos__dato cifra">{x.atendidos}</span>
                  <span className="modulos__min">{x.atendidos ? `${Math.round(x.atencion)} min c/u` : ""}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="tarjeta tarjeta--ancha">
            <h2>Por servicio</h2>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Turnos</th>
                  <th>En espera</th>
                  <th>Espera promedio</th>
                  <th>Atención promedio</th>
                </tr>
              </thead>
              <tbody>
                {m.porServicio.map((x) => (
                  <tr key={x.servicio.id}>
                    <td>
                      <span className={`etiqueta etiqueta--${x.servicio.id}`}>{x.servicio.id}</span> {SERVICIOS[x.servicio.id].nombre}
                    </td>
                    <td className="cifra">{x.turnos}</td>
                    <td className="cifra">{x.enEspera}</td>
                    <td className={`cifra${x.espera > 15 ? " alerta" : ""}`}>{x.turnos ? `${Math.round(x.espera)} min` : ""}</td>
                    <td className="cifra">{x.atencion ? `${Math.round(x.atencion)} min` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
