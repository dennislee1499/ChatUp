import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./Register";
import Login from "./Login";
import { useContext } from "react";
import { UserContext } from "./UserContext";

export default function AppRoutes() {
    const { username } = useContext(UserContext);

    return (
        <Router>
            <Routes>
                <Route path="/register" element={ <Register /> } />
                <Route path="/login" element={ <Login /> } />
                <Route path="/" element={ username ? `Logged In! ${username}` : <Login /> } />
            </Routes>
        </Router>
    )
}