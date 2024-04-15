import React, { useState, useEffect, useContext } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { app } from "../firebase/config";
import "./MapPage.css";
import { AuthContext } from '../context/authContext';

const MapPage = () => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [isInsidePolygon, setIsInsidePolygon] = useState<boolean>(false); // Estado para armazenar se o usuário está dentro do polígono
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDwJ9sDEc8lKE8IE0wWCSFFvex1WfxlsDU"
  });

  const db = getFirestore(app);
  const { handleLogOut } = useContext(AuthContext);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "localizacoes", "usuario"), (doc) => {
      if (doc.exists()) {
        const { latitude, longitude } = doc.data();
        setCurrentPosition({ lat: latitude, lng: longitude });
        // Verifica se a posição atual está dentro do polígono
        setIsInsidePolygon(isPointInsidePolygon({ lat: latitude, lng: longitude }, polygonCoords));
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
            // Verifica se a posição atual está dentro do polígono
            setIsInsidePolygon(isPointInsidePolygon({ lat: latitude, lng: longitude }, polygonCoords));
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

  const handleLogoutClick = () => {
    handleLogOut();
  };

  const mapStyles = {
    height: "80vh",
    width: "100%"
  };

  const defaultCenter = currentPosition || { lat: -15.769564, lng: -47.892929 };

  const polygonCoords = [
    { lat: -15.76940278, lng: -47.89238889 }, // Ponto direito baixo
    { lat: -15.76971667, lng: -47.89352778 }, // Ponto esquerdo baixo
    { lat: -15.76414167, lng: -47.89402778 }, // Ponto direito cima
    { lat: -15.76450556, lng: -47.89533889 }  // Ponto esquerdo cima
  ];

  // Função para verificar se um ponto está dentro de um polígono
  const isPointInsidePolygon = (point: { lat: number, lng: number }, polygon: { lat: number, lng: number }[]): boolean => {
    const x = point.lat;
    const y = point.lng;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;

      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  return (
    <div className="map"> 
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={15}
          center={defaultCenter}
        >
          {/* Adiciona o polígono delimitador da área */}
          <Polygon
            paths={[polygonCoords]} // Array de coordenadas do polígono
            options={{
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#FF0000",
              fillOpacity: 0.35
            }}
          />

          {/* Adiciona o marcador da posição atual */}
          {currentPosition && (
            <Marker position={currentPosition} />
          )}

        </GoogleMap>
      ) : (
        <div>Carregando mapa...</div>
      )}
      <p>O usuário está dentro do polígono: {isInsidePolygon ? 'Sim' : 'Não'}</p>
      <button onClick={getUserLocation}>Atualizar Localização</button>
      <button onClick={handleLogoutClick}>Logoff</button>
    </div>
  );
};

export default MapPage;
