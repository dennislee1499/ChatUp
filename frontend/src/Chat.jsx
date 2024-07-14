import { useEffect, useState } from "react"
import Avatar from "./Avatar";
import Logo from "./Logo";

export default function Chat() {
    const [connected, setConnected] = useState(null);
    const [activeUsers, setActiveUsers] = useState({}); 
    const [selectedUserId, setSelectedUserId] = useState(null);  

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');
        setConnected(ws);
        ws.addEventListener('message', handleMsg);
    }, []);

    function showActiveUsers(userArr) {
        const filteredUsers = userArr.filter(user => Object.keys(user).length > 0); 

        const user = {}; 
        filteredUsers.forEach(({ userId, username }) => {
            user[userId] = username;
        })

        setActiveUsers(user);
    }

    function handleMsg(e) {
        const msgData = JSON.parse(e.data); 
        if ('online' in msgData) {
            showActiveUsers(msgData.online); 
        }
    }

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3">
                <Logo />
                {Object.keys(activeUsers).map(userId => (
                    <div onClick={() => setSelectedUserId(userId)} 
                         key={userId} 
                         className={"border-b border-gray-100 py-2 pl-4 flex items-center gap-2 cursor-pointer "+(userId === selectedUserId ? 'bg-blue-50' : '')}
                    >
                        <Avatar username={activeUsers[userId]} userId={userId} />
                        <span>{activeUsers[userId]}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-col bg-blue-100 w-2/3 p-2">
                <div className="flex-grow">
                    Messages with selected person
                </div>
                <div className="flex gap-1">
                    <input type="text" 
                           placeholder="Type here" 
                           className="bg-white border flex-grow rounded-sm p-1" 
                    />
                    <button className="bg-blue-500 text-white rounded-sm p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
} 