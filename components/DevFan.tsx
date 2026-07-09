import Image from "next/image";

// Fichas pre-renderizadas una sola vez con nuestro propio endpoint OG y
// guardadas como estáticas en /public — así el abanico de la landing no le
// pega a la API de GitHub en cada visita.
const FAN_CARDS = [
  { username: "torvalds", rotation: -8 },
  { username: "mojombo", rotation: -3 },
  { username: "yyx990803", rotation: 4 },
  { username: "addyosmani", rotation: 9 },
] as const;

export function DevFan() {
  return (
    <div className="flex justify-center" style={{ perspective: 1200 }}>
      {FAN_CARDS.map((card, i) => (
        <div
          key={card.username}
          data-reveal-fan-card
          data-rotation={card.rotation}
          className={`relative w-[150px] shrink-0 sm:w-[180px] ${i > 0 ? "-ml-14 sm:-ml-16" : ""}`}
          style={{ zIndex: i }}
        >
          {/* Hover lift vive en un hijo separado: GSAP controla el transform
              (rotation) de este div padre, y Tailwind controla el transform
              (translate/scale) del hijo — así no compiten por la misma propiedad. */}
          <div className="group/card transition-transform duration-300 ease-out hover:z-20 hover:-translate-y-5 hover:scale-110">
            <div className="overflow-hidden rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.4),0_24px_48px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-shadow duration-300 group-hover/card:shadow-[0_16px_32px_rgba(0,0,0,0.5),0_40px_70px_-16px_rgba(0,0,0,0.75)]">
              <Image
                src={`/fan-cards/${card.username}.png`}
                alt={`Ficha de ${card.username}`}
                width={340}
                height={453}
                className="h-auto w-full"
                priority={i === 0}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
