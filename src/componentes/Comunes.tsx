import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <Link to="/" className={`logo${claro ? " logo--claro" : ""}`} aria-label="Siguiente, ir al inicio">
      <span className="logo__ficha" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M8 5l8 7-8 7" />
        </svg>
      </span>
      Siguiente
    </Link>
  );
}

/** La barra de arriba de las pantallas de trabajo, para moverse entre ellas. */
export function BarraPantallas() {
  const enlaces = [
    ["/kiosco", "Kiosco"],
    ["/ventanilla", "Ventanilla"],
    ["/sala", "Sala de espera"],
    ["/panel", "Panel"],
  ];
  return (
    <header className="barra">
      <Logo />
      <nav className="barra__nav" aria-label="Pantallas">
        {enlaces.map(([a, nombre]) => (
          <NavLink key={a} to={a}>
            {nombre}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export function useAhora(cada = 1000) {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cada);
    return () => clearInterval(id);
  }, [cada]);
  return ahora;
}

export const hora = (t: number) => new Date(t).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

export function Reloj() {
  const ahora = useAhora(1000);
  return <time className="reloj">{hora(ahora)}</time>;
}

export function cronometro(desde: number, ahora: number) {
  const s = Math.max(0, Math.floor((ahora - desde) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
