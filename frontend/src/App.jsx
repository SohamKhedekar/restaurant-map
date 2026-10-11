import { useRef } from "react";
import "./App.css";
import WorldMap from "./components/WorldMap";
import Search from "./components/Search";

function App() {
  const mapRef = useRef(null);

  return (
    <>
      <nav>
        <h1>
          <span className="flame" aria-hidden="true">●</span>
          hottest spot<span className="long"> in town</span>
        </h1>
        <Search onSelect={hotspot => mapRef.current?.goToHotspot(hotspot)} />
      </nav>
      <WorldMap ref={mapRef} />
    </>
  );
}

export default App;
