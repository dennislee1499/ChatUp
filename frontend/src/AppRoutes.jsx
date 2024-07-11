import { Routes, Route, useNavigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import { useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function AppRoutes() {
    const { username } = useContext(UserContext);
    const navigate = useNavigate(); 

    useEffect(() => {
        if (username) {
            navigate('/')
        } else {
            navigate('/login')
        }
    }, [username, navigate])

    return (
            <Routes>
                <Route path="/register" element={ <Register /> } />
                <Route path="/login" element={ <Login /> } />
                <Route path="/" element={ <Chat /> } />
            </Routes>
    )
}