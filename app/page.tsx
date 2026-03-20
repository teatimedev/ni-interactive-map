import { MapProvider } from "@/components/MapProvider";
import MapApp from "@/components/MapApp";

export default function Home() {
  return (
    <MapProvider>
      <MapApp />
    </MapProvider>
  );
}
