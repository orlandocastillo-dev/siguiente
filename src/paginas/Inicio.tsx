import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "../componentes/Comunes";
import { Paleta } from "../componentes/Paleta";
import { useDespacho } from "../store";
import { diaDeEjemplo } from "../store/ejemplo";
import { reemplazar } from "../store/turnos";

// Lo que va mostrando la pantalla de la portada, sin tocar la fila de verdad
const DEMO = [
  { codigo: "C-041", modulo: 2 },
  { codigo: "P-007", modulo: 3 },
  { codigo: "A-019", modulo: 4 },
  { codigo: "R-012", modulo: 5 },
  { codigo: "C-042", modulo: 1 },
  { codigo: "A-020", modulo: 3 },
];

function PantallaDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % DEMO.length), 3400);
    return () => clearInterval(id);
  }, []);
  const actual = DEMO[i];
  const antes = [1, 2, 3, 4].map((k) => DEMO[(i - k + DEMO.length * 2) % DEMO.length]);

  return (
    <figure className="tv" aria-label="Ejemplo de la pantalla de la sala llamando turnos">
      <div className="tv__marco">
        <div className="tv__pantalla">
          <div className="tv__cabeza">
            <span>Sala de espera</span>
            <span className="tv__vivo">
              <i /> En vivo
            </span>
          </div>
          <div className="tv__llamado" key={i}>
            <div>
              <small>Turno</small>
              <Paleta texto={actual.codigo} className="paleta--media" />
            </div>
            <svg viewBox="0 0 48 24" aria-hidden="true">
              <path d="M2 12h40M32 3l10 9-10 9" />
            </svg>
            <div>
              <small>Módulo</small>
              <Paleta texto={String(actual.modulo)} className="paleta--media paleta--modulo" />
            </div>
          </div>
          <ul className="tv__antes">
            {antes.map((t, k) => (
              <li key={k}>
                <span>{t.codigo}</span>
                <span>Módulo {t.modulo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="tv__pata" aria-hidden="true" />
    </figure>
  );
}

const PANTALLAS = [
  {
    a: "/kiosco",
    nombre: "Kiosco",
    texto: "La persona toca el servicio que necesita y recibe su turno con cuánta gente tiene adelante y cuánto le toca esperar.",
    icono: "M6 3h12v18H6zM9 7h6M9 11h6M10 17h4",
  },
  {
    a: "/ventanilla",
    nombre: "Ventanilla",
    texto: "El funcionario llama al siguiente con un botón o con la tecla N. Ve su fila, vuelve a llamar o marca que no se presentó.",
    icono: "M3 20h18M5 20V9h14v11M8 9V5h8v4M10 14h4",
  },
  {
    a: "/sala",
    nombre: "Sala de espera",
    texto: "La pantalla grande anuncia cada turno con timbre y voz, y muestra los últimos llamados y la espera por servicio.",
    icono: "M3 5h18v11H3zM8 20h8M12 16v4",
  },
  {
    a: "/panel",
    nombre: "Panel",
    texto: "Cuántos turnos van, cuánto se espera, qué módulo atiende más y a qué hora llega la gente.",
    icono: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  },
];

export function Inicio() {
  const despachar = useDespacho();
  const ir = useNavigate();

  function cargarEjemplo() {
    despachar(reemplazar(diaDeEjemplo()));
    ir("/ventanilla?m=3");
  }

  return (
    <div className="inicio">
      <header className="inicio__barra">
        <Logo claro />
        <nav>
          <a href="#pantallas">Pantallas</a>
          <a href="#probar">Cómo probarlo</a>
          <a href="#dentro">Por dentro</a>
        </nav>
      </header>

      <section className="portada">
        <div className="portada__luz" aria-hidden="true" />
        <div className="portada__texto">
          <p className="sobre sobre--ambar">Sistema de turnos en tiempo real</p>
          <h1>
            Que nadie tenga que preguntar <em>“¿ya me llamaron?”</em>
          </h1>
          <p className="portada__bajada">
            Siguiente organiza la fila de una oficina de atención: el kiosco entrega el turno, la ventanilla llama al siguiente y la sala lo anuncia en
            pantalla y por voz, al instante.
          </p>
          <div className="portada__botones">
            <Link className="boton boton--ambar" to="/oficina">
              Probarlo en una sola pantalla
            </Link>
            <button className="boton boton--borde" onClick={cargarEjemplo}>
              Ver una mañana de ejemplo
            </button>
          </div>
          <dl className="portada__datos">
            <div>
              <dt>Al instante</dt>
              <dd>entre pantallas</dd>
            </div>
            <div>
              <dt>Preferencial</dt>
              <dd>siempre primero</dd>
            </div>
            <div>
              <dt>Voz</dt>
              <dd>en cada llamado</dd>
            </div>
          </dl>
        </div>
        <PantallaDemo />
      </section>

      <section className="seccion" id="pantallas">
        <p className="sobre sobre--ambar">01 Pantallas</p>
        <h2>Cuatro pantallas, una sola fila</h2>
        <div className="pantallas">
          {PANTALLAS.map((p) => (
            <Link key={p.a} to={p.a} target="_blank" className="pantalla-tarjeta">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={p.icono} />
              </svg>
              <h3>{p.nombre}</h3>
              <p>{p.texto}</p>
              <span className="pantalla-tarjeta__abrir">Abrir en otra pestaña</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="seccion seccion--probar" id="probar">
        <p className="sobre sobre--ambar">02 Cómo probarlo</p>
        <h2>Saque un turno y llámelo, todo en la misma pantalla</h2>
        <ol className="pasos">
          <li>
            <b>1</b>
            <p>
              Entre a <Link to="/oficina">todo junto</Link>: ahí están el kiosco, la ventanilla y la sala, una al lado de la otra.
            </p>
          </li>
          <li>
            <b>2</b>
            <p>Toque un servicio en el kiosco. El turno aparece en la fila de la ventanilla.</p>
          </li>
          <li>
            <b>3</b>
            <p>Toque “Llamar al siguiente”. La sala lo anuncia en ese mismo momento, y con voz si enciende el sonido.</p>
          </li>
        </ol>
        <p className="nota nota--clara">Si quiere verlo como en una oficina real, abra cada pantalla en su propia pestaña: se mueven juntas. Todo se guarda en este navegador y cada día la fila arranca en cero.</p>
      </section>

      <section className="seccion" id="dentro">
        <p className="sobre sobre--ambar">03 Por dentro</p>
        <h2>Cómo está hecho</h2>
        <div className="dentro">
          <div>
            <h3>Un solo estado, varias pantallas</h3>
            <p>
              La fila vive en Redux Toolkit. Cada acción (sacar turno, llamar, terminar) se guarda y se transmite a las otras pestañas por
              BroadcastChannel, que la aplican igual. Así todas ven lo mismo sin recargar.
            </p>
          </div>
          <div>
            <h3>Nunca dos llamados al mismo</h3>
            <p>
              La ventanilla decide a quién llama antes de mandar la acción, con el turno ya escogido. Si otra pestaña lo llamó un instante antes, el
              segundo llamado se descarta.
            </p>
          </div>
          <div>
            <h3>Reglas de una oficina real</h3>
            <p>
              Cada módulo atiende ciertos servicios, los preferenciales pasan primero donde se atienden, y la espera se estima con la gente en fila,
              lo que dura cada servicio y cuántos módulos lo atienden.
            </p>
          </div>
          <div>
            <h3>Hecho con</h3>
            <p>React, TypeScript, Redux Toolkit, React Router, Web Audio y Web Speech para el timbre y la voz, y Vitest para las reglas de la fila.</p>
          </div>
        </div>
      </section>

      <footer className="inicio__pie">
        <Logo claro />
        <p>
          Hecho por <a href="https://orlandocastillo.vercel.app">Orlando Castillo</a> en Barranquilla, 2025 – 2026.
        </p>
        <a href="https://github.com/orlandocastillo-dev/siguiente">Código en GitHub</a>
      </footer>
    </div>
  );
}
