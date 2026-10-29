import { useEffect, useRef, useState } from "react";

const LETRAS = "ACPR0123456789-";

/** Una ficha de tablero de aeropuerto: al cambiar, pasa por unas letras al azar antes de quedar en la nueva. */
function Ficha({ caracter, retraso }: { caracter: string; retraso: number }) {
  const [visible, setVisible] = useState(caracter);
  const [girando, setGirando] = useState(false);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      setVisible(caracter);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(caracter);
      return;
    }
    const pasos = 5 + Math.floor(Math.random() * 3);
    const ids: number[] = [];
    for (let i = 0; i <= pasos; i++) {
      ids.push(
        window.setTimeout(() => {
          setVisible(i === pasos ? caracter : LETRAS[Math.floor(Math.random() * LETRAS.length)]);
          setGirando(i < pasos);
        }, retraso + i * 70),
      );
    }
    return () => ids.forEach(clearTimeout);
  }, [caracter, retraso]);

  return (
    <span className={`ficha${girando ? " ficha--gira" : ""}${caracter === "-" ? " ficha--guion" : ""}`}>
      <span className="ficha__arriba">{visible}</span>
      <span className="ficha__abajo" aria-hidden="true">
        {visible}
      </span>
    </span>
  );
}

export function Paleta({ texto, className = "" }: { texto: string; className?: string }) {
  return (
    <span className={`paleta ${className}`} aria-label={texto} role="img">
      {[...texto].map((c, i) => (
        <Ficha key={i} caracter={c} retraso={i * 55} />
      ))}
    </span>
  );
}
