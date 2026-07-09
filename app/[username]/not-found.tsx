import Link from "next/link";

export default function PlayerNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl">🔴</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        Jugador no encontrado en ninguna liga
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Ese usuario de GitHub no existe, o quedó libre de todos los mercados. Probá con otro nombre.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-tm-blue-bright px-5 py-3 font-display font-bold uppercase tracking-wide text-pitch transition-colors hover:bg-white"
      >
        Volver al mercado
      </Link>
    </main>
  );
}
