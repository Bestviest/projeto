import { createContext, useEffect, useState } from 'react'
import { loginWithCredentials, logoutFirebase, onAuthStateHasChanged, signInWithCredentials, singInWithGoogle } from '../firebase/providers'

export interface AuthStateContext {
    status: 'checking' | 'authenticated' | 'no-authenticated';
    userId: string | null; 
    userEmail: string | null;
    userName: string | null;

    
    handleLoginWithGoogle: () => Promise<void>
    handleLoginWithCredentials: (password: string, email: string) => Promise<void>
    handleRegisterWithCredentials: (password: string, email: string) => Promise<void>
    handleLogOut: () => Promise<void>
}

const initialState: Pick<AuthStateContext, 'status' | 'userId' | 'userEmail' | 'userName'> = {
    userId: null,
    status: 'checking',
    userEmail: null,
    userName: null,
   
}

export const AuthContext = createContext({} as AuthStateContext)

interface IElement { children: JSX.Element | JSX.Element[] }

export const AuthProvider = ({ children }: IElement) => {

    const [session, setSession] = useState<Pick<AuthStateContext, 'status' | 'userId' | 'userEmail' | 'userName'>>(initialState)

    useEffect(() => {
            onAuthStateHasChanged(setSession)
    }, [])

    const handleLoginWithGoogle = async () => {
        const result = await singInWithGoogle();
        if (result) {
            setSession({
                status: 'authenticated',
                userId: result.uid, // Aqui é onde o userId é definido
                userEmail: result.userEmail, // Aqui é onde o userEmail é definido
                userName: result.name, // Aqui é onde o userName é definido
            });
        }
    };

    const handleLogOut = async () => {
        logoutFirebase()
        setSession({ userId: null, status: 'no-authenticated', userEmail: null, userName: null })
    }

    const validateAuth = (userId: string | undefined) => {
        if (userId) return setSession({ userId, status: 'authenticated', userEmail: null, userName: null })
        handleLogOut()
    }

    const checking = () => setSession(prev => ({ ...prev, status: 'checking' }))

    const handleLoginWithCredentials = async (password: string, email: string) => {
        checking()
        const userId = await loginWithCredentials({ email, password })
        validateAuth(userId)
    }

    const handleRegisterWithCredentials = async (password: string, email: string) => {
        checking()
        const userId = await signInWithCredentials({ email, password })
        validateAuth(userId)
    }

    return (
        <AuthContext.Provider
            value={{
                ...session,
                handleLoginWithGoogle,
                handleLoginWithCredentials,
                handleRegisterWithCredentials,
                handleLogOut
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}