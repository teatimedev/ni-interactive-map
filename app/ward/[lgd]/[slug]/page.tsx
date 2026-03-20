import fs from "fs";
import path from "path";
import { Metadata } from "next";
import { MapProvider } from "@/components/MapProvider";
import MapApp from "@/components/MapApp";
import districts from "@/data/districts";

interface WardEntry {
  slug: string;
  name: string;
}

interface WardFile {
  lgd: string;
  lgdSlug: string;
  wards: WardEntry[];
}

function readAllWards(): { lgd: string; slug: string; name: string; districtName: string }[] {
  const wardsDir = path.join(process.cwd(), "data", "wards");
  const files = fs.readdirSync(wardsDir);
  const result: { lgd: string; slug: string; name: string; districtName: string }[] = [];

  for (const file of files) {
    const data: WardFile = JSON.parse(
      fs.readFileSync(path.join(wardsDir, file), "utf-8")
    );
    for (const ward of data.wards) {
      result.push({
        lgd: data.lgdSlug,
        slug: ward.slug,
        name: ward.name,
        districtName: data.lgd,
      });
    }
  }

  return result;
}

export async function generateStaticParams() {
  const allWards = readAllWards();
  return allWards.map((w) => ({ lgd: w.lgd, slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lgd: string; slug: string }>;
}): Promise<Metadata> {
  const { lgd, slug } = await params;
  const allWards = readAllWards();
  const ward = allWards.find((w) => w.lgd === lgd && w.slug === slug);
  const district = districts.find((d) => d.slug === lgd);

  const wardName = ward ? ward.name : slug;
  const districtName = district?.name ?? lgd;

  return {
    title: `${wardName} Ward, ${districtName} — The Big Dirty NI Map`,
    description: `Population, housing, health, education and transport data for ${wardName} ward in ${districtName}`,
    openGraph: {
      title: `${wardName} Ward, ${districtName} — The Big Dirty NI Map`,
      description: `Population, housing, health, education and transport data for ${wardName} ward in ${districtName}`,
      images: ["/og-image.png"],
    },
  };
}

export default async function WardPage({
  params,
}: {
  params: Promise<{ lgd: string; slug: string }>;
}) {
  const { lgd, slug } = await params;
  return (
    <MapProvider>
      <MapApp initialDistrict={lgd} initialWard={slug} />
    </MapProvider>
  );
}
