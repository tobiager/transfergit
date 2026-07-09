import { fetchRepoStarCount } from "@/lib/repoStats";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const stars = await fetchRepoStarCount();
  return <NavbarClient stars={stars} />;
}
