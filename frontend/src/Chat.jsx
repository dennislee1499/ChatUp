import { useContext, useEffect, useRef, useState } from "react"
// import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import axios from "axios";
import { uniqBy } from "lodash";
import Users from "./Users";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [activeUsers, setActiveUsers] = useState({}); 
    const [inactiveUsers, setInactiveUsers] = useState({}); 
    const [selectedUserId, setSelectedUserId] = useState(null);  
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const { username, id, setUsername, setId } = useContext(UserContext);
    const msgRef = useRef();

    useEffect(() => {
        connectToWs();
    }, []);

    function connectToWs() {
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
            setTimeout(() => {
                console.log('Disconnected, trying to connect')
            }, 1500)
            connectToWs();
        };

        return () => {
            ws.close();
        };
    }

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
        console.log({ e, msgData })
        if ('online' in msgData) {
            showActiveUsers(msgData.online); 
        } else if ('text' in msgData) {
            setMessages(prev => ([...prev, { ...msgData }]));
        }
    }

    function sendMsg(e) {
        e.preventDefault(); 
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                recipient: selectedUserId,
                text: messageInput,
            }));
        } else {
            console.error('W.S is not open');
        }
        setMessageInput('');
        setMessages(prev => ([...prev, {
            text: messageInput, 
            sender: id,
            recipient: selectedUserId, 
            _id: Date.now(),
        }]));
    }

    function logout() {
        axios.post('/logout').then(() => {
            setId(null);
            setUsername(null);
        })
    }

    useEffect(() => {
        axios.get('/users').then(res => {
            const offlineUsersArr = res.data
                .filter(u => u._id !== id)
                .filter(u => !Object.keys(activeUsers).includes(u._id));
            const offlineUsers = {};
            offlineUsersArr.forEach(u => {
                offlineUsers[u._id] = u; 
            })
            setInactiveUsers(offlineUsers);
        });
    }, [activeUsers]);

    useEffect(() => {
        if (msgRef.current) {
            msgRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [messages])

    useEffect(() => {
        if (selectedUserId) {
            axios.get('/messages/'+selectedUserId).then(res => {
                setMessages(res.data);
            })
        }
    }, [selectedUserId])

    const activeUsersExcludingSelf = {...activeUsers}; 
    delete activeUsersExcludingSelf[id];

    const msgsWithoutDup = uniqBy(messages, '_id');

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
                <div className="flex-grow">
                    <Logo />
                    {Object.keys(activeUsersExcludingSelf).map(userId => (
                        <Users
                            key={userId} 
                            id={userId} 
                            online={true}
                            username={activeUsersExcludingSelf[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}
                    {Object.keys(inactiveUsers).map(userId => (
                        <Users
                            key={userId} 
                            id={userId} 
                            online={false}
                            username={inactiveUsers[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}
                </div>
                <div className="p-2 text-center">
                    <button
                        onClick={logout} 
                        className="text-gray-600 bg-blue-300 py-1 px-3 border rounded-md">
                            Logout
                    </button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-100 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-400">&larr; Start Chatting!</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-4">
                                {msgsWithoutDup.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div key={message._id} className={"text-left inline-block p-2 rounded-md my-2 text-sm " +(message.sender === id ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white')}>
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={msgRef}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-1" onSubmit={sendMsg}>
                        <input type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)} 
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