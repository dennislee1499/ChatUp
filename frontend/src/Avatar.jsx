export default function Avatar({ userId, username, online }) {
    const colors = ['bg-red-300', 'bg-red-300', 'bg-yellow-300',
                    'bg-purple-300', 'bg-blue-300', 'bg-green-300'];

    const userIdBase10 = parseInt(userId, 16);
    const colorIdx = userIdBase10 % colors.length;
    const color = colors[colorIdx]; 

    return (
        <div className={"w-7 h-7 relative rounded-full flex items-center "+color}>
            <div className="text-center w-full opacity-70">
                { username[0] }
            </div>
            {online && (
                <div className="absolute w-2 h-2 bg-green-500 bottom-0 right-0.5 rounded-full border-white"></div>
            )}
            {!online && (
                 <div className="absolute w-2 h-2 bg-gray-400 bottom-0 right-0.5 rounded-full border-white"></div>
            )}
        </div>
    )
}