import axios from "axios";
import { UserContextProvider } from "./UserContext";
import AppRoutes from "./AppRoutes";

function App() {
  axios.defaults.baseURL = 'http://localhost:4000';
  axios.defaults.withCredentials = true; 
  
  return (
    <UserContextProvider>
      <AppRoutes />
    </UserContextProvider>
  )
}

export default App
