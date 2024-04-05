import React from "react";
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import "./MapPage.css";

export interface MapPageProps {}

const MapPage = () => {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDwJ9sDEc8lKE8IE0wWCSFFvex1WfxlsDU"
      });

    return( 
        <div className="map">
        { isLoaded ? (
      <GoogleMap
        mapContainerStyle={{width: '100%', height: '100%'}}
        center={{
            lat: -15.769564, 
            lng: -47.892929
        }}
    
        zoom={15}
      ></GoogleMap>
  ) : (  
  <></> 
)}
    </div>
)
};


export default MapPage; 