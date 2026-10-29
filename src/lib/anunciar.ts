let audio: AudioContext | null = null;

/** Los navegadores no dejan sonar nada hasta que alguien toque la página. */
export function activarSonido() {
  audio ??= new AudioContext();
  void audio.resume();
  // Pide las voces de una vez; en Chrome llegan tarde
  speechSynthesis?.getVoices();
}

export const sonidoActivo = () => audio?.state === "running";

// Dos notas, como el timbre de un aeropuerto
function timbre() {
  if (!audio) return 0;
  const notas = [880, 659.25];
  notas.forEach((f, i) => {
    const t = audio!.currentTime + i * 0.42;
    const osc = audio!.createOscillator();
    const vol = audio!.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.32, t + 0.02);
    vol.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    osc.connect(vol).connect(audio!.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  });
  return 1000;
}

function voz() {
  const voces = speechSynthesis.getVoices();
  return voces.find((v) => v.lang === "es-CO") ?? voces.find((v) => v.lang === "es-US" || v.lang === "es-MX") ?? voces.find((v) => v.lang.startsWith("es"));
}

/** "Turno C 14, módulo 2" */
export function anunciar(codigo: string, modulo: number) {
  const espera = timbre();
  if (!("speechSynthesis" in window)) return;
  const [letra, numero] = codigo.split("-");
  const frase = new SpeechSynthesisUtterance(`Turno ${letra}, ${Number(numero)}. Módulo ${modulo}.`);
  const v = voz();
  if (v) frase.voice = v;
  frase.lang = v?.lang ?? "es-CO";
  frase.rate = 0.92;
  setTimeout(() => {
    speechSynthesis.cancel();
    speechSynthesis.speak(frase);
  }, espera);
}
