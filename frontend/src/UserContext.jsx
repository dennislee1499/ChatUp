import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [username, setUsername] = useState(null); 
    const [id, setId] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        axios.get('/profile').then(response => {
            setId(response.data.userId);
            setUsername(response.data.username);
            setLoading(false); 
        }).catch(() => {
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <UserContext.Provider value={{ username, setUsername, id, setId }}>
            {children}
        </UserContext.Provider>
    )
}