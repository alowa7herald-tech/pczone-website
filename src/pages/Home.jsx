
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "../firebase";

import HomeHero from "../components/home/HomeHero";
import PlayerTypes from "../components/home/PlayerTypes";
import StationOverview from "../components/home/StationOverview";

const defaultStations = Array.from({ length: 12 }, (_, index) => ({
  id: `PC-${String(index + 1).padStart(2, "0")}`,
  label: `PC ${String(index + 1).padStart(2, "0")}`,
  status: "available",
  occupied: false,
}));

function Home({ user }) {
  const [stations, setStations] = useState(defaultStations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "stations"),
      (snapshot) => {
        const stationData = new Map(
          snapshot.docs.map((document) => [
            document.id,
            document.data(),
          ])
        );

        const updatedStations = defaultStations.map((station) => {
          const data = stationData.get(station.id);
          const status = (data?.status || "Available").toLowerCase();

          return {
            ...station,
            status,
            occupied: status === "occupied",
          };
        });

        setStations(updatedStations);
        setLoading(false);
      },
      (error) => {
        console.error("Home station loading error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <main>
      <HomeHero
        user={user}
        stations={stations}
        loading={loading}
      />

      <PlayerTypes />

      <StationOverview
        stations={stations}
        loading={loading}
      />
    </main>
  );
}

export default Home;
