import { useContext } from "react"
import { Login, Register } from "./components"
import { AuthContext } from './context/authContext';
import { MapPage } from "./pages/MapPage";

const App = () => {

  const { status, userId } = useContext(AuthContext)

  if (status === 'checking') return <p className="loading"><span>Checking credentials, wait a moment...</span></p>

  return (
    <main>
      <h1><b>Projeto TCC com</b> <span>Firebase</span> <b>e</b> <span>React</span></h1>
      {
        (status === 'authenticated' && userId)
          ? <MapPage />
          : <AuthPage />
      }
    </main>
  )
}
export default App

export const HomePage = () => {
  const { userId, handleLogOut } = useContext(AuthContext)

  return (
    <section>
      <h5>Your ID is: <span>{userId}</span></h5>
      <button className="btn-logout" onClick={handleLogOut}>Log out</button>
    </section>
  )
}

export const AuthPage = () => {
  return (
    <section>
      <Login />
      <Register />
    </section>
  )
}