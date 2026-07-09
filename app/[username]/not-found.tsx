import Link from "next/link";

export default function PlayerNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-6xl">🔴</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">
        Player not found in any league
      </h1>
      <p className="mt-3 max-w-md text-muted">
        That GitHub username doesn&apos;t exist, or they&apos;ve gone free agent from every market. Try another name.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-tm-blue-bright px-5 py-3 font-display font-bold uppercase tracking-wide text-pitch transition-colors hover:bg-white"
      >
        Back to the market
      </Link>
    </main>
  );
}
