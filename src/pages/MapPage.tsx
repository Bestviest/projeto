import  { useState, useEffect, useContext, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon } from '@react-google-maps/api';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, getDoc } from "firebase/firestore";
import { app } from "../firebase/config";
import "./MapPage.css";
import { AuthContext } from '../context/authContext';
import Webcam from "react-webcam";
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { getAuth } from "firebase/auth";
import * as faceapi from 'face-api.js';
import { ImageUrl } from "@azure/cognitiveservices-face/esm/models/mappers";
import { FaceClient } from '@azure/cognitiveservices-face';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import axios from 'axios'; 


export const MapPage = () => {

  const [currentPosition, setCurrentPosition] = useState<{ lat: number, lng: number } | null>(null);
  // const [isInsidePolygon, setIsInsidePolygon] = useState<boolean>(false); // Estado para armazenar se o usuário está dentro do polígono
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDwJ9sDEc8lKE8IE0wWCSFFvex1WfxlsDU"
  });

  const db = getFirestore(app);
  const firestore = getFirestore();
  const { handleLogOut, userId } = useContext(AuthContext);
  const webcamRef = useRef<Webcam>(null);
  const [showModal, setShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageSaved, setImageSaved]  = useState<string | null>(null);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  
  const [isInsidePolygon, setIsInsidePolygon] = useState(false);
 

  const loadModels = async () => {
    const MODEL_URL = '/public/models';
    try {
      const response = await fetch(MODEL_URL);
      if (response.headers?.get('content-type')?.includes('application/json')) {
        const models = await response.json();
        return Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(models.tinyFaceDetector),
          faceapi.nets.faceLandmark68Net.loadFromUri(models.faceLandmark68Net),
          faceapi.nets.faceRecognitionNet.loadFromUri(models.faceRecognitionNet),
          faceapi.nets.faceExpressionNet.loadFromUri(models.faceExpressionNet),
          faceapi.nets.ssdMobilenetv1.loadFromUri(models.ssdMobilenetv1) 
        ]);
      } else {
        throw new Error('A resposta não é um JSON válido');
      }
    } catch (error) {
      console.error('Erro ao carregar os modelos:', error);
    }
  };
  
  // ...
  
  loadModels().then(() => {
    handleFaceRecognition();
  });


   
  const [isFirstCapture, setIsFirstCapture] = useState(localStorage.getItem('isFirstCapture') === 'true');

  // const key = '5cc803bcd6764dc6972c353663fc62a7';
  // const endpoint = 'https://reconhecimentofacialceubtcc.cognitiveservices.azure.com';
  
  // const faceclient = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }), endpoint);
  
  const capture = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const storage = getStorage();
        const storageRef = ref(storage, `images/${user.uid}`);
        await uploadString(storageRef, imageSrc, 'data_url');
        const imageUrl = await getDownloadURL(storageRef);
  
        await setDoc(doc(firestore, 'users', user.uid), {
          imageUrl: imageUrl,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName, 
        });
        
        handleClose();
        setImageSaved(imageSrc); // Marca a imagem como salva
        setIsFirstCapture(false); // Marca que a primeira foto foi capturada
        localStorage.setItem('isFirstCapture', 'false'); // Armazena o valor no localStorage
      }
    }
  };
  // const capture = async () => {
  //   const imageSrc = webcamRef.current?.getScreenshot();
  //   if (imageSrc) {
  //     const auth = getAuth();
  //     const user = auth.currentUser;
  //     if (user) {
  //       await setDoc(doc(firestore, 'users', user.uid), {
  //         imageUrl: imageSrc,
  //         userId: user.uid,
  //         userEmail: user.email,
  //         userName: user.displayName, 
  //       });
        
  //       handleClose();
  //       setImageSaved(imageSrc); // Marca a imagem como salva
  //       setIsFirstCapture(false); // Marca que a primeira foto foi capturada
  //       localStorage.setItem('isFirstCapture', 'false'); // Armazena o valor no localStorage
           
  //     }
  //   }
  // };

 

  const handleNewCapture = () => {
    localStorage.setItem('isFirstCapture', 'true'); // Reset the localStorage
    setShowModal(true); // Open the modal 
  };
  
  const handleOpenModal = () => {
    setModalIsOpen(true);
  };

  const handleFaceRecognition = async () => {
    
   
    if (!modelsLoaded) {
      console.error('Os modelos do face-api.js ainda não foram carregados');
      return;
    }

    const webcam = webcamRef.current;
    if (!webcam) {
      console.error('Webcam não disponível');
      return;
    }

    const imageSrc = webcam.getScreenshot();
    if (!imageSrc) {
      console.error('Não foi possível obter a imagem da webcam');
      return;
    }

    const storage = getStorage();
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData && userData.imageUrl) {
          const savedImageUrl = userData.imageUrl;

          // Upload da nova imagem para o Firebase Storage
          const timestamp = Date.now();
          const storageRef = ref(storage, `images/${timestamp}`);
          const snapshot = await uploadString(storageRef, imageSrc, 'data_url');
          const currentImageUrl = await getDownloadURL(snapshot.ref);

          // Salvar a URL da nova imagem no Firestore
          await setDoc(doc(db, 'users', user.uid), {
            ...userData,
            imagemAtual: currentImageUrl,
          });

          // Usar face-api.js para comparar as imagens
          const savedImg = await faceapi.fetchImage(savedImageUrl);
          const newImg = await faceapi.fetchImage(currentImageUrl);

          const savedDetections = await faceapi.detectSingleFace(savedImg).withFaceLandmarks().withFaceDescriptor();
          const newDetections = await faceapi.detectSingleFace(newImg).withFaceLandmarks().withFaceDescriptor();

          if (savedDetections && newDetections) {
            const dist = faceapi.euclideanDistance(savedDetections.descriptor, newDetections.descriptor);
            if (dist < 0.6) {
              const recognitionTime = new Date();
              const userName = user.displayName;

              try {
                await setDoc(doc(db, 'recognitions', user.uid), {
                  recognitionTime: recognitionTime,
                  userName: userName,
                });
                console.log('Dados salvos com sucesso no Firestore');
              } catch (error) {
                console.error('Erro ao salvar dados no Firestore:', error);
              }
            } else {
              console.error('Os rostos não são idênticos');
            }
          }
        }
      }
    }
  };

// const handleFaceRecognition = async () => {
//   const webcam = webcamRef.current;
//   if (!webcam) {
//     console.error('Webcam não disponível');
//     return;
//   }

//   const imageSrc = webcam.getScreenshot();
//   if (!imageSrc) {
//     console.error('Não foi possível obter a imagem da webcam');
//     return;
//   }
//   const storage = getStorage();
//   const auth = getAuth();
//   const user = auth.currentUser;
//   if (user) {
    
//     const docSnap = await getDoc(doc(firestore, 'users', user.uid));
//     if (docSnap.exists()) {
//       const userData = docSnap.data();
//       if (userData) {
//         const savedImageUrl = userData.ImageUrl; // Obtenha a URL da imagem salva

//         // Upload da nova imagem para o Firebase Storage
//         const timestamp = Date.now();
//         const storageRef = ref(storage, `images/${timestamp}`);
//         const snapshot = await uploadString(storageRef, imageSrc, 'data_url');
//         const currentImageUrl = await getDownloadURL(snapshot.ref);

//         // Salvar a URL da nova imagem no Firestore
//         await setDoc(doc(firestore, 'users', user.uid), {
//           ...userData,
//           imagemAtual: currentImageUrl,
//         });

//         const savedImg = await faceapi.fetchImage(savedImageUrl);
//         const newImg = await faceapi.fetchImage(imageSrc);

//         const savedDetections = await faceapi.detectSingleFace(savedImg).withFaceLandmarks().withFaceDescriptor();
//         const newDetections = await faceapi.detectSingleFace(newImg).withFaceLandmarks().withFaceDescriptor();

//         if (savedDetections && newDetections) {
//           const dist = faceapi.euclideanDistance(savedDetections.descriptor, newDetections.descriptor);
//           if (dist < 0.6) { // Este é um limite de exemplo, você pode precisar ajustá-lo para o seu caso
//             const recognitionTime = new Date();
//             const userName = user.displayName;

//             try {
//               await setDoc(doc(firestore, 'recognitions', user.uid), {
//                 recognitionTime: recognitionTime,
//                 userName: userName,
//               });
//               console.log('Dados salvos com sucesso no Firestore');
//             } catch (error) {
//               console.error('Erro ao salvar dados no Firestore:', error);
//             }
//           } else {
//             console.error('Os rostos não são idênticos');
//           }
//         }
//       }
//     }
//   }
// };

  // const handleFaceRecognition = async () => {
  //   const webcam = webcamRef.current;
  //   if (!webcam) {
  //     console.error('Webcam não disponível');
  //     return;
  //   }
  
  //   const imageSrc = webcam.getScreenshot();
  //   if (!imageSrc) {
  //     console.error('Não foi possível obter a imagem da webcam');
  //     return;
  //   }
  
  //   const response = await fetch(imageSrc)
  //   const blob = await response.blob();
  //   if (!blob) {
  //     console.error('Não foi possível criar o blob da imagem');
  //     return;
  //   }
  
  //   const auth = getAuth();
  //   const user = auth.currentUser;
  //   if (user) {
  //     const docSnap = await getDoc(doc(firestore, 'users', user.uid));
  //     if (docSnap.exists()) {
  //       const userData = docSnap.data();
  //       if (userData && isImageSaved) {
           
  //         // Crie uma instância do FaceClient
  //       const faceClient = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': '5cc803bcd6764dc6972c353663fc62a7' } }), 'https://reconhecimentofacialceubtcc.cognitiveservices.azure.com');
        
  //       const savedFaceResponse = await faceClient.face.detectWithUrl(isImageSaved); 
  //         if (!savedFaceResponse || savedFaceResponse.length === 0) {
  //           console.error('Não foi possível detectar o rosto na imagem salva');
  //           return;
  //         }

  //         const newFaceResponse = await faceClient.face.detectWithStream(blob);
  //         if (!newFaceResponse || newFaceResponse.length === 0) {
  //           console.error('Não foi possível detectar o rosto na nova imagem');
  //           return;
  //         }
  
  //           const savedFaceId = savedFaceResponse[0].faceId;
  //           const newFaceId = newFaceResponse[0].faceId;
          
  //           if (savedFaceId && newFaceId)
  //            {
  //             const verifyResult = await faceClient.face.verifyFaceToFace(savedFaceId, newFaceId);
  //             console.log('Resultado da verificação:', verifyResult);
  //             if (!verifyResult.isIdentical) {
  //               console.error('Os rostos não são idênticos');
  //               return;
  //             }

  //             const recognitionTime = new Date();
  //             const userName = user.displayName;
            
  //             try {
  //               await setDoc(doc(firestore, 'recognitions', user.uid), {
  //                 recognitionTime: recognitionTime,
  //                 userName: userName,
  //               });
  //               console.log('Dados salvos com sucesso no Firestore');
  //             } catch (error) {
  //               console.error('Erro ao salvar dados no Firestore:', error);
  //             }
              
  //           } 
  //       }
  //     }
  //   }

  //   // Feche o modal após o reconhecimento facial
  //   setModalIsOpen(false);
  // };
  
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "localizacoes", "usuario"), (doc) => {
      if (doc.exists()) {
        const { latitude, longitude } = doc.data();
        setCurrentPosition({ lat: latitude, lng: longitude });
        // Verifica se a posição atual está dentro do polígono
        setIsInsidePolygon(isPointInsidePolygon({ lat: latitude, lng: longitude }, polygonCoords));
       
        if (userId && !showModal && isFirstCapture) {
          setShowModal(true); // Show the modal with the webcam after the user logs in for the first time
        }
      }
    });
  
    return () => unsubscribe();
  }, [db, userId, showModal, isFirstCapture]);

  

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
          <button onClick={handleNewCapture}>Capture New Photo</button>
         
          <Button onClick={handleOpenModal}>Reconhecimento Facial</Button>
          <Modal show={modalIsOpen} onHide={() => setModalIsOpen(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Webcam Feed</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setModalIsOpen(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={handleFaceRecognition}>
                Recognize Face
              </Button>
            </Modal.Footer>
          </Modal>
      
          

      
      
      
            
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

