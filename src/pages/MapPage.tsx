import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { app } from "../firebase/config"; // Importa a instância do Firebase app
import "./MapPage.css";

const MapPage = () => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDwJ9sDEc8lKE8IE0wWCSFFvex1WfxlsDU"
  });

  const db = getFirestore(app); // Inicializa o Firestore com a instância do Firebase App

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "localizacoes", "usuario"), (doc) => {
      if (doc.exists()) {
        const { latitude, longitude } = doc.data();
        setCurrentPosition({ lat: latitude, lng: longitude });
      }
    });

    return () => unsubscribe();
  }, [db]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await setDoc(doc(db, "localizacoes", "usuario"), { latitude, longitude });
            setCurrentPosition({ lat: latitude, lng: longitude });
          } catch (error) {
            console.error("Error setting user location: ", error);
          }
        },
        (error) => {
          console.error("Error getting user location: ", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser");
    }
  };

  const mapStyles = {
    height: "80vh",
    width: "100%"
  };

  const defaultCenter = currentPosition || { lat: -15.769564, lng: -47.892929 };

  return (
    <div className="map">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={15}
          center={defaultCenter}
        >
          {currentPosition && (
            <Marker position={currentPosition} />
          )}
        </GoogleMap>
      ) : (
        <div>Carregando mapa...</div>
      )}
      <button onClick={getUserLocation}>Atualizar Localização</button>
    </div>
  );
};

export default MapPage;
