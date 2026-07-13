import { SearchInput } from "./SearchInput";

export function ScoutCta() {
  return (
    <div className="tm-card tm-card-green flex flex-col items-center gap-4 rounded-xl p-6 text-center md:p-8">
      <h2 className="font-display text-2xl uppercase leading-tight tracking-tight md:text-3xl">
        Think you&apos;re worth more? ⚽ Get scouted
      </h2>
      <SearchInput placeholder="your-github-username" reveal={false} />
    </div>
  );
}
