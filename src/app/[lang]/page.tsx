import { notFound } from "next/navigation";
import { HomeExperience } from "@/components/HomeExperience";
import { isLang } from "@/lib/i18n";
import { getPortfolio } from "@/lib/portfolio";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const portfolio = await getPortfolio();
  return <HomeExperience lang={lang} portfolio={portfolio} />;
}
