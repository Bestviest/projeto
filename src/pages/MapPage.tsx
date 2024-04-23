import  { useState, useEffect, useContext, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { app } from "../firebase/config";
import "./MapPage.css";
import { AuthContext } from '../context/authContext';
import { singInWithGoogle } from "../firebase/providers";
import Webcam from "react-webcam";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import { FaceClient } from '@azure/cognitiveservices-face';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { getAuth } from "firebase/auth";




export const MapPage = () => {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);
  const [isInsidePolygon, setIsInsidePolygon] = useState<boolean>(false); // Estado para armazenar se o usuário está dentro do polígono
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDwJ9sDEc8lKE8IE0wWCSFFvex1WfxlsDU"
  });

  const db = getFirestore(app);
  const { handleLogOut, userId, userEmail } = useContext(AuthContext);
  const webcamRef = useRef<Webcam>(null);
  const [showModal, setShowModal] = useState(false);
  const [isImageSaved, setImageSaved] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);
  
  // // Inicialize o cliente da Face API
  // const faceClient = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': 'a017ecb9549e4b11bf1b24a5eb943f26' } }), 'https://reconhecimentofacialceubtcc.cognitiveservices.azure.com/');
  
  const firestore = getFirestore();
  
  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(firestore, 'users', user.uid), {
          imageUrl: imageSrc,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName,
        });
        handleClose();
        setImageSaved(true); // Marca a imagem como salva

      }
    }
  };



//   const capture = useCallback(
//   async () => {
    
//     const imageSrc = webcamRef.current?.getScreenshot();
//     if (imageSrc && userId) {
//       try {
//   // Remove the prefix from the base64 string
//   const base64Image = imageSrc.split(',')[1];

//   console.log('Base64 image:', base64Image);
  
//   // Transforme userId para personGroupId
//   const personGroupId = userId.toLowerCase().replace(/[^a-z0-9-_]/g, '');


//    // Verifique se o personGroupId já existe
//   try {
//     await faceClient.personGroup.get(personGroupId);
//     console.log(`Person group with ID ${personGroupId} already exists.`);
//   } catch (error) {
//     if ((error as any).statusCode === 404) {
//       // Person group with personGroupId does not exist, so you can create a new one
//       await faceClient.personGroup.create(personGroupId);
//       console.log(`Created new person group with ID ${personGroupId}.`);
//     } else {
//       // Some other error occurred
//       throw error;
//     }
//   }

//   // Crie uma nova pessoa no grupo e obtenha o ID da pessoa
//   const person = await faceClient.personGroupPerson.create(personGroupId, { name: userId });
//   const storageRef = ref(getStorage(app), `gs://tcc-reconhecimento-facia-77899.appspot.com/Fotos_usuarios/${userId}.jpeg`);
//   await uploadString(storageRef, base64Image, 'base64');
//   const imageUrl = await getDownloadURL(storageRef);
  
//   // Adicione uma face à pessoa
//   await faceClient.personGroupPerson.addFaceFromUrl(personGroupId, person.personId, imageUrl);
//   console.log('Image saved successfully');

//         // Save the image URL to Firestore
//         await setDoc(doc(db, 'users', userId), {
//           imageUrl: imageUrl,
//           userId: userId,
//           userEmail: userEmail
//         });

//         // Close the modal after the image is saved
//         setShowModal(false);
//       } catch (error) {
//         console.error("Error capturing image: ", error);
//       }
//     }
// }, [userId, app, webcamRef, db, setShowModal]); // Add setShowModal to


  
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "localizacoes", "usuario"), (doc) => {
      if (doc.exists()) {
        const { latitude, longitude } = doc.data();
        setCurrentPosition({ lat: latitude, lng: longitude });
        // Verifica se a posição atual está dentro do polígono
        setIsInsidePolygon(isPointInsidePolygon({ lat: latitude, lng: longitude }, polygonCoords));
        if ( userId && !showModal) {
          setShowModal(true); // Show the modal with the webcam after the user logs in for the first time
        }
      }
    });

    return () => unsubscribe();
  }, [db, userId, showModal]);

  

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
      {/* <button onClick={onButtonClick}>Reconhecimento Facial</button>  */}
      <button onClick={handleShow}>Abrir Webcam</button>
 
      {!isImageSaved && (
  <Modal show={showModal} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Webcam Snapshot</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
      />
      <Button onClick={capture}>Capture photo</Button>
    </Modal.Body>
  </Modal>
)}

    </div>
  );
};


