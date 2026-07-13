import Link from "next/link";
import { SearchInput } from "@/components/SearchInput";

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
      <div className="mt-6">
        <SearchInput autoFocus placeholder="github-username" />
      </div>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-foreground">
        Back to the market
      </Link>
    </main>
  );
}
