import { HomeExperience } from "@/components/HomeExperience";
import { getPortfolio } from "@/lib/portfolio";

export default async function Home() {
  const portfolio = await getPortfolio();
  return <HomeExperience portfolio={portfolio} />;
}
