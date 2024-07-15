import { useContext, useEffect, useState } from "react"
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [activeUsers, setActiveUsers] = useState({}); 
    const [selectedUserId, setSelectedUserId] = useState(null);  
    const [message, setMessage] = useState('');
    const { username, id } = useContext(UserContext);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000'); 
        ws.onopen = () => {
            console.log("W.S connection established"); 
            setWs(ws); 
        };

        ws.onmessage = handleMsg; 
        ws.onerror = (error) => {
            console.error("W.S error:", error);
        };
        ws.onclose = () => {
            console.log("W.S connection closed");
        };

        return () => {
            ws.close();
        };
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

    function sendMsg(e) {
        e.preventDefault(); 
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                message: {
                    recipient: selectedUserId,
                    text: message,
                }
            }));
        } else {
            console.error('W.S is not open');
        }
    }

    const activeUsersExcludingSelf = {...activeUsers}; 
    delete activeUsersExcludingSelf[id];

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3">
                <Logo />
                {Object.keys(activeUsersExcludingSelf).map(userId => (
                    <div onClick={() => setSelectedUserId(userId)} 
                         key={userId} 
                         className={"border-b border-gray-100 flex items-center gap-2 cursor-pointer "+(userId === selectedUserId ? 'bg-blue-50' : '')}
                    >
                        {userId === selectedUserId && (
                            <div className="w-1 h-12 bg-blue-500 rounded-r-md"></div>
                        )}
                        <div className="flex gap-2 py-2 pl-4 items-center">
                            <Avatar username={activeUsers[userId]} userId={userId} />
                            <span>{activeUsers[userId]}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex flex-col bg-blue-100 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">&larr; Start Chatting!</div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-1" onSubmit={sendMsg}>
                        <input type="text"
                            value={message}
                            onChange={e => setMessage(e.target.value)} 
                            placeholder="Type here" 
                            className="bg-white border flex-grow rounded-sm p-1" 
                        />
                        <button type="submit" className="bg-blue-500 text-white rounded-sm p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>  
                )}
            </div>
        </div>
    )
} 