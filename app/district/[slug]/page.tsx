import { Metadata } from "next";
import { MapProvider } from "@/components/MapProvider";
import MapApp from "@/components/MapApp";
import districts from "@/data/districts";

export async function generateStaticParams() {
  return districts.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const district = districts.find((d) => d.slug === slug);
  const name = district?.name || "District";
  return {
    title: `${name} — The Big Dirty NI Map`,
    description: `Population, crime, housing, deprivation and more for ${name}`,
    openGraph: {
      title: `${name} — The Big Dirty NI Map`,
      description: `Population, crime, housing, deprivation and more for ${name}`,
      images: [`/api/og?type=district&slug=${slug}`],
    },
  };
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <MapProvider>
      <MapApp initialDistrict={slug} />
    </MapProvider>
  );
}
