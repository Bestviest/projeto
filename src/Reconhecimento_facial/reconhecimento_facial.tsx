import { FaceClient } from '@azure/cognitiveservices-face';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { database } from '../firebase/config';

// Inicialize o cliente da Face API
const faceClient = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription': '3a2a087b54cb459b8b303b39531445c2' } }), 'https://reconhecimentofacialceubtcc.cognitiveservices.azure.com/');

// export const handleButtonClick = async (captureImage: any, userLocation: any, polygonCoords: any, isPointInsidePolygon: any) => {
//   // Verifique se o usuário está dentro do polígono
//   if (!isPointInsidePolygon(userLocation, polygonCoords)) {
//     alert('Você não está dentro da área permitida.');
//     return;
//   }

//   // Ative a câmera e capture a imagem
//   const image = await captureImage(); // Substitua por função real

//   const result = await faceClient.face.detectWithStream(image);
//   if (result.length === 0) {
//     alert('Não foi possível reconhecer o rosto.');
//     return;
//   }

//   // Adicione o novo usuário ao Firebase Realtime Database
//   await database.ref('users').push({
//     id: result[0].faceId,
//     location: userLocation
//   });
// };