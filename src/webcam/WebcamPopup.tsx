import React, { useRef, useState, useEffect } from 'react';
import Webcam from "react-webcam";
import { FirebaseAuth, app } from '../firebase/config'; // Importe sua configuração do Firebase
import { getAuth } from "firebase/auth";
import {onAuthStateHasChanged} from '../firebase/providers'
import { ImageUrl } from '@azure/cognitiveservices-face/esm/models';

export const WebcamPopup = ({ onCapture}: {onCapture: (ImageUrl: string) => void }) => {

  const webcamRef = useRef<Webcam>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [imageURL, setImageURL] = useState("");

  const capture = React.useCallback(
    () => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        const imageURL = "data:image/jpeg;base64," + imageSrc;
        setImageURL(imageURL);
        onCapture(imageURL); //chama a função onCapture com a URL da imagem 
      }
    },
    [webcamRef, onCapture]
  );

  useEffect(() => {
    FirebaseAuth.auth(app).onAuthStateChanged(user => {
      if (user) {
        setShowWebcam(true);
      } else {
        setShowWebcam(false);
      }
    });
  }, []);

  if (!showWebcam) {
    return null;
  }

  return (
    <>
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      <button onClick={capture}>Capture photo</button>
    </>
  );
};