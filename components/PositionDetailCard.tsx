import type { Player } from "@/lib/types";
import { PositionPitch } from "./PositionPitch";

export function PositionDetailCard({ position }: { position: Player["position"] }) {
  return (
    <div data-reveal-item className="overflow-hidden rounded-xl tm-card">
      <h2 className="bg-tm-blue-deep px-4 py-2 font-table text-lg font-bold uppercase tracking-wide text-white">
        Position in Detail
      </h2>
      <div className="p-4">
        <div className="mx-auto max-w-[180px]">
          <PositionPitch main={position.main} secondary={position.secondary} />
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-tm-blue-bright" /> {position.main}
          </span>
          {position.secondary !== position.main && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-tm-blue-bright bg-surface" />{" "}
              {position.secondary}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
