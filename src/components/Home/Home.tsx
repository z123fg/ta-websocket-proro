import React, { useContext, useEffect, useState } from "react";
import UserContext from "../../contexts/userContext";
import { Navigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
interface Room {
    id: string;
    roomName: string;
    owner?: string;
    users?: User[];
    history?: any[];
}

interface User {
    id: string;
    username: string;
    ICE?: string;
    lastLogin?: Date;
    lastActive?: Date;
    online?: boolean;
    createdRooms?: Room[];
    room?: Room;
}
const Home = () => {
    const { user: curUser, login, signup, signout } = useContext(UserContext);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [joinRoomName, setJoinRoomName] = useState("");
    const [createRoomName, setCreateRoomName] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);

    const currentRoom = onlineUsers.find((user) => user.id === curUser.userId)?.room;

    const isLogin = !(curUser.token === null);
    useEffect(() => {
        if (!curUser.token) return;
        const socket = io("http://localhost:3002", {
            auth: {
                token: curUser.token,
            },
        });
        setSocket(socket);
    }, [curUser]);

    useEffect(() => {
        if (!socket) {
            //alert("ws is not connected");
            setIsConnecting(true);
            return;
        }
        setIsConnecting(false);
        const onConnect = () => {
            console.log("connect");
        };
        const onUpdateOnlineUser = (users: User[]) => {
            setOnlineUsers(users);
        };

        const onUpdateRooms = (rooms: Room[]) => {
            setRooms(rooms);
        };
        const onDisconnect = () => {
            console.log("disconnect");
        };
        const onConnectError = (err: any) => {
            alert("connection error, reason:" + err)
        };

        const onError = (err: any) => {
            alert(err);
        };
        const onLobby = () => {};
        console.log("trying to connect");
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("updateonlineusers", onUpdateOnlineUser);
        socket.on("updaterooms", onUpdateRooms);
        socket.on("lobby", onLobby);
        socket.on("updaterooms", onUpdateRooms);
        socket.on("error", onError);
        return () => {
            socket.off("connect_error", onConnectError);
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("updateonlineusers", onUpdateOnlineUser);
            socket.off("updaterooms", onUpdateRooms);
            socket.off("lobby", onLobby);
            socket.off("updaterooms", onUpdateRooms);
            socket.off("error", onError);
        };
    }, [socket]);
    const handleJoinRoom = () => {
        if (!socket) {
            alert("ws is not connected");
            return;
        }
        socket.emit("joinroom", joinRoomName, (res:any)=>{console.log("res", res)});
    };

    const handleCreateRoom = () => {
        if (!socket) {
            alert("ws is not connected");
            return;
        }
        socket.emit("createroom", createRoomName);
    };

    const handleQuitRoom = () => {
        if (!socket) {
            alert("ws is not connected");
            return;
        }

        socket.emit("quitroom");
    };
    return (
        <div>
            {isLogin ? (
                isConnecting ? (
                    "loading"
                ) : (
                    <div>
                        <h1>currentRoom: {currentRoom?.roomName || "not joined"}</h1>
                        <div>
                            {rooms.map((room) => (
                                <div key={room.roomName}>{room.roomName}</div>
                            ))}
                        </div>
                        <div>
                            {onlineUsers.map((user) => (
                                <div key={user.username}>
                                    {user.username}
                                    {` in room: `}
                                    {user.room?.roomName}
                                </div>
                            ))}
                        </div>
                        <div>
                            <input onChange={(e) => setJoinRoomName(e.target.value)} value={joinRoomName} />
                            <button onClick={handleJoinRoom}>join room</button>
                        </div>
                        <div>
                            <input
                                onChange={(e) => setCreateRoomName(e.target.value)}
                                value={createRoomName}
                            />
                            <button onClick={handleCreateRoom}>create room</button>
                        </div>
                        <div>
                            <button onClick={handleQuitRoom}>quit room</button>
                        </div>
                    </div>
                )
            ) : (
                <Navigate to="/login" />
            )}
        </div>
    );
};

export default Home;
