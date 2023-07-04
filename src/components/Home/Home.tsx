import React, { useContext, useEffect, useState } from "react";
import UserContext from "../../contexts/userContext";
import { Navigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { Server } from "http";
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
    ICEOffer?: string;
    lastLogin?: Date;
    lastActive?: Date;
    online?: boolean;
    createdRooms?: Room[];
    room?: Room;
}

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
    ],
    iceCandidatePoolSize: 10,
};

interface IPeerConnectionMap {
    [id: string]: { peerConnection: RTCPeerConnection; localDescription: RTCSessionDescriptionInit };
}
interface ICE {
    id: string;
    sessionDescriptionString: string;
    target: User;
    owner: User;
}

export interface ISessionDescriptionMap {
    [id: string]: string;
}
const Home = () => {
    const { user: curUser, login, signup, signout } = useContext(UserContext);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
    const [joinRoomName, setJoinRoomName] = useState("");
    const [createRoomName, setCreateRoomName] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [peerConnectionMap, setPeerConnectionMap] = useState<IPeerConnectionMap>({});
    const [totalICEs, setTotalICEs] = useState<ICE[]>([]);

    const currentRoom = onlineUsers.find((user) => user.id === curUser.userId)?.room;

    const isLogin = !(curUser.token === null);
    console.log("curUser", curUser);
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
        (async () => {
            if (!curUser.token) return;
            const newPeerConnectionMap: IPeerConnectionMap = {};
            if (
                JSON.stringify(Object.keys(peerConnectionMap)) ===
                JSON.stringify(onlineUsers.map((user) => user.id))
            ) {
                return;
            }
            let exclusiveOnlineUser = onlineUsers.filter((user) => user.id !== curUser.userId && user);
            for (let user of exclusiveOnlineUser) {
                const peerConnection =
                    peerConnectionMap[user.id]?.peerConnection || new RTCPeerConnection(servers);
                let localDescription/*  =
                    peerConnectionMap[user.id]?.localDescription ||
                    (user.id < curUser.userId! ? await peerConnection.createOffer() : null); */
                    if(user.id <)
                newPeerConnectionMap[user.id] = {
                    localDescription,
                    peerConnection,
                };
            }
            setPeerConnectionMap(newPeerConnectionMap);

            /*  onlineUsers.forEach((user) => {
                const peerConnection = peerConnectionMap[user.id]?.peerConnection || new RTCPeerConnection(servers);
                const localDescription = peerConnectionMap[user.id]?.localDescription || (user.id > curUser.userId? await peerConnection.createAnswer() : )
            newPeerConnectionMap[user.id] = {
                peerConnection,
                localDescription
            };
        }); */
        })();
    }, [onlineUsers]);

    useEffect(() => {
        const sessionDescriptionMap: ISessionDescriptionMap = Object.fromEntries(
            Object.entries(peerConnectionMap).map(([id, obj]) => {
                return [id, JSON.stringify(obj.localDescription)];
            })
        );
        socket?.emit("updatelocalice", curUser.userId, sessionDescriptionMap);
    }, [peerConnectionMap]);

    useEffect(() => {
        let newPeerConnectionMap: IPeerConnectionMap = {};
        totalICEs
            .filter(({ target }) => {
                return target.id === curUser.userId;
            })
            .forEach(async ({ owner, sessionDescriptionString }) => {
                const peerConnection = peerConnectionMap[owner.id].peerConnection;
                if (owner.id > curUser.userId!) {
                    peerConnection.setRemoteDescription(JSON.parse(sessionDescriptionString));
                    const myAnswer = await peerConnection.createAnswer();
                    peerConnection.setLocalDescription(myAnswer);
                    newPeerConnectionMap[owner.id] = { peerConnection, localDescription: myAnswer };
                } else if (owner.id < curUser.userId!) {
                    peerConnection.setRemoteDescription(JSON.parse(sessionDescriptionString));
                }
            });

        if (Object.keys(newPeerConnectionMap).length !== 0) {
            setPeerConnectionMap((prev) => ({ ...prev, ...newPeerConnectionMap }));
        }
    }, [totalICEs]);

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
        const onUpdateOnlineUsers = (users: User[]) => {
            console.log("users", users);

            setOnlineUsers(users);
        };

        const onUpdateRooms = (rooms: Room[]) => {
            setRooms(rooms);
        };
        const onDisconnect = () => {
            console.log("disconnect");
        };
        const onConnectError = (err: any) => {
            alert("connection error, reason:" + err);
        };

        const onError = (err: any) => {
            alert(err);
        };
        const onLobby = () => {};

        const onUpdateICEs = (ICEs: ICE[]) => {
            setTotalICEs(ICEs);
        };
        console.log("trying to connect");
        socket.on("updateices", onUpdateICEs);
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("updateonlineusers", onUpdateOnlineUsers);
        socket.on("updaterooms", onUpdateRooms);
        socket.on("lobby", onLobby);
        socket.on("updaterooms", onUpdateRooms);
        socket.on("error", onError);
        return () => {
            socket.off("updateices", onUpdateICEs);

            socket.off("connect_error", onConnectError);
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("updateonlineusers", onUpdateOnlineUsers);
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
        socket.emit("joinroom", joinRoomName, (res: any) => {
            console.log("res", res);
        });
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
