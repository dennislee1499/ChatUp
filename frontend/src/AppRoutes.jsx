import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function AppRoutes() {
    const { username } = useContext(UserContext);

    return (
            <Routes>
                <Route path="/register" element={ <Register /> } />
                <Route path="/login" element={ <Login /> } />
                <Route path="/" element={ username ? <Chat /> : <Navigate to="/login"/> } />
            </Routes>
    )
}