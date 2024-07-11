import { useContext, useState } from "react"
import { UserContext } from "./UserContext";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const { setUsername: setLoggedInUser, setId } = useContext(UserContext);
    
    async function login(e) {
        e.preventDefault(); 
        try {
            const { data } = await axios.post('/login', { username, password }); 
            console.log('Login response:', data);
            setLoggedInUser(username); 
            setId(data.id); 
        } catch (err) {
            console.error('Login Failed:', err); 
        }
    }

    return (
        <div className="bg-blue-50 h-screen flex items-center">
            <form className="w-64 mx-auto mb-12" onSubmit={login}>
                <input value={username}
                       onChange={e => setUsername(e.target.value)}
                       type="text" placeholder="Username" 
                       className="block w-full rounded-sm p-2 mb-2 border" 
                />
                <input value={password} 
                       onChange={e => setPassword(e.target.value)} 
                       type="password" placeholder="Password" 
                       className="block w-full rounded-sm p-2 mb-2 border" 
                />
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2">Login</button>
                <div className="text-center cursor-pointer mt-4">
                    <Link to="/register">Not a member?</Link>
                </div>
            </form>
        </div>
    )
}