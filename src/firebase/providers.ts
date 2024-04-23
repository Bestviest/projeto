import {
    createUserWithEmailAndPassword, GoogleAuthProvider,
    onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup
} from 'firebase/auth'
import { AuthStateContext } from '../context/authContext'
import { FirebaseAuth } from './config'
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";



const googleProvider = new GoogleAuthProvider()


export const singInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(FirebaseAuth, googleProvider)

        const { uid, displayName, email } = result.user

        // displayName is the name of the user
        const name = displayName;
        // email is the email of the user
        const userEmail = email;
        
        return { uid, name, userEmail }

    } catch (e) {
        alert((e as Error).message)
    }
}


interface PropsRegister {
    email: string
    password: string
}

export const signInWithCredentials = async ({ email, password }: PropsRegister) => {

    try {
        const resp = await createUserWithEmailAndPassword(FirebaseAuth, email, password);

        return resp.user.uid

    } catch (e) {
        alert((e as Error).message)
    }

}

export const loginWithCredentials = async ({ email, password }: PropsRegister) => {

    try {
        const resp = await signInWithEmailAndPassword(FirebaseAuth, email, password);

        return resp.user.uid

    } catch (e) {

        alert((e as Error).message)
    }
}

//essa variavel é responsável por fazer a verificação e salvar depois os dados no firestore 
type StateDispatch = React.Dispatch<React.SetStateAction<Pick<AuthStateContext, "status" | "userId" | "userEmail" | "userName">>>

export const onAuthStateHasChanged = (setSession: StateDispatch) => {
    onAuthStateChanged(FirebaseAuth, async user => {
        if (!user) return setSession({ status: 'no-authenticated', userId: null, userEmail: null, userName: null})

    //Aqui é onde você salva os dados no Firestore
    const db = getFirestore();
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { imageUrl, name, email } = docSnap.data();
      setSession({ status: 'authenticated', userId: user.uid, userEmail: email, userName: name})
    }
  })
}

export const logoutFirebase = async () => await FirebaseAuth.signOut()