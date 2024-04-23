// import { FaceClient } from '@azure/cognitiveservices-face';
// import { ApiKeyCredentials } from '@azure/ms-rest-js';

// // Inicialize o cliente da Face API
// const faceClient = new FaceClient(new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': 'a017ecb9549e4b11bf1b24a5eb943f26' } }), 'https://reconhecimentofacialceubtcc.cognitiveservices.azure.com/');

// export async function createPersonGroup(personGroupId: string): Promise<void> {
//     try {
//         await faceClient.personGroup.create(personGroupId, personGroupId);
//     } catch (error) {
//         console.error('Erro ao criar grupo de pessoas:', error);
//         throw error;
//     }
// }

// export async function createPerson(personGroupId: string, name: string): Promise<string> {
//     try {
//         const personGroupPerson = await faceClient.personGroupPerson.create(personGroupId, { name });
//         return personGroupPerson.personId;
//     } catch (error) {
//         console.error('Erro ao criar pessoa:', error);
//         throw error;
//     }
// }

// export async function addFace(personGroupId: string, personId: string, url: string): Promise<string> {
//     try {
//         const face = await faceClient.personGroupPerson.addFaceFromUrl(personGroupId, personId, url);
//         return face.persistedFaceId;
//     } catch (error) {
//         console.error('Erro ao adicionar face:', error);
//         throw error;
//     }
// }

// export { faceClient };