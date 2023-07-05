import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import UserContext from "../../contexts/userContext";
import { Navigate } from "react-router-dom";
import { Socket, io } from "socket.io-client";
import { Server } from "http";
import { throttle, debounce } from "lodash";
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
    [id: string]: RTCPeerConnection & { dc: any };
}
interface SessionDescription {
    id?: string;
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
    const [totalSDs, setTotalSDs] = useState<SessionDescription[]>([]);
    const [targetSDs, setTargetSDs] = useState(totalSDs.filter((item) => item.target.id === curUser.userId));
    const tempRef = useRef({ peerConnectionMap, targetSDs });
    const currentRoom = useMemo(()=>onlineUsers.find((user) => user.id === curUser.userId)?.room,[onlineUsers]);

    const debounceSetState = useCallback(
        debounce(() => {
            console.log("debounce");
            setPeerConnectionMap(tempRef.current.peerConnectionMap);
            setTargetSDs(tempRef.current.targetSDs);
        }, 2000),
        [setTargetSDs, setPeerConnectionMap]
    );

    const setStates = (newPCMap?: any, newTargetSD?: any) => {
        newPCMap && (tempRef.current.peerConnectionMap = newPCMap);
        newTargetSD && (tempRef.current.targetSDs = newTargetSD);
        debounceSetState();
    };

    useEffect(() => {
        setStates(
            undefined,
            totalSDs.filter((item) => item.target.id === curUser.userId)
        );
    }, [totalSDs]);

    //remote session descriptions that is for this client to connect
    //console.log("totalSDs", totalSDs);

    const roomUsers = useMemo(
        () => onlineUsers.filter((user) => user.room?.roomName === currentRoom?.roomName),
        [currentRoom, onlineUsers]
    );
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
        const timeout = setInterval(() => {
            Object.entries(peerConnectionMap).forEach(([id, pc]) => {
                console.log("state", id, pc.connectionState, totalSDs, peerConnectionMap);
            });
        }, 2000);
        return () => clearInterval(timeout);
    }, [peerConnectionMap, totalSDs]);


    useEffect(() => {
        const newPeerConnectionMap: IPeerConnectionMap = {};
        const exclusiveUsers: User[] = roomUsers.filter((user) => user.id !== curUser.userId);
        console.log("pm", peerConnectionMap)
        for (let user of exclusiveUsers) {
            let pc: RTCPeerConnection;
            if (user.id in peerConnectionMap) {
                pc = peerConnectionMap[user.id];
                const state = pc.connectionState;
                if (state === "failed" || state === "disconnected") {
                    pc.close();
                    pc = new RTCPeerConnection(servers);
                } else if (state === "closed") {
                    pc = new RTCPeerConnection(servers);
                }
            } else {
                pc = new RTCPeerConnection(servers);
            }
            newPeerConnectionMap[user.id] = peerConnectionMap[user.id] ?? new RTCPeerConnection();
        }

        Object.entries(peerConnectionMap).forEach(([id, pc])=>{
            if(!(id in newPeerConnectionMap)){
                pc.close()
            }
        });
        console.log("pm2", newPeerConnectionMap)
        setStates(newPeerConnectionMap, undefined);
    }, [roomUsers]);

    useEffect(() => {
        (async () => {
            const newOwnerSDMap: ISessionDescriptionMap = {};
            const targetSDsMap = Object.fromEntries(
                targetSDs.map(({ target, owner, sessionDescriptionString }) => {
                    return [owner.id, sessionDescriptionString];
                })
            );
            //console.log("effect", peerConnectionMap, targetSDs);
            await Promise.all(
                Object.entries(peerConnectionMap).map(
                    ([id, pc]) =>
                        new Promise<void>(async (res, rej) => {
                            const remoteDescription = targetSDsMap[id];
                            if (id > curUser.userId!) {
                                //console.log("greater", pc.remoteDescription, remoteDescription);
                                if (pc.remoteDescription === null && remoteDescription !== undefined) {
                                    await pc.setRemoteDescription(JSON.parse(remoteDescription));
                                    const myAnswer = await pc.createAnswer();
                                    pc.ondatachannel = (e: any) => {
                                        pc.dc = e.channel;
                                        pc.dc.onmessage = () => {
                                            console.log("meesage");
                                        };
                                        pc.dc.onopen = () => {
                                            console.log("open");
                                        };
                                    };
                                    pc.onicecandidate = () => {
                                        newOwnerSDMap[id] = JSON.stringify(pc.localDescription);
                                        res();
                                    };
                                    await pc.setLocalDescription(myAnswer);
                                } else {
                                    res();
                                }
                            } else if (id < curUser.userId!) {
                               // console.log("smaller", pc.localDescription);
                                if (pc.localDescription === null) {
                                    const dc = pc.createDataChannel("dc1");
                                    pc.onicecandidate = () => {
                                        newOwnerSDMap[id] = JSON.stringify(pc.localDescription);
                                        res();
                                    };
                                    const myOffer = await pc.createOffer();
                                    await pc.setLocalDescription(myOffer);
                                } else {
                                    if (pc.remoteDescription === null && remoteDescription !== undefined) {
                                        await pc.setRemoteDescription(JSON.parse(remoteDescription));
                                    }
                                    res();
                                }
                            }
                        })
                )
            );

            if (Object.keys(newOwnerSDMap).length !== 0) {
                socket!.emit("updateownersessiondescriptions", newOwnerSDMap);
            }
        })();
    }, [peerConnectionMap, targetSDs]);

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

        const onUpdateTargetSessionDescription = (SDs: SessionDescription[]) => {
            setTotalSDs(SDs);
        };
        console.log("trying to connect");
        socket.on("updatetargetsessiondescriptions", onUpdateTargetSessionDescription);
        socket.on("connect", onConnect);
        socket.on("connect_error", onConnectError);
        socket.on("disconnect", onDisconnect);
        socket.on("updateonlineusers", onUpdateOnlineUsers);
        socket.on("updaterooms", onUpdateRooms);
        socket.on("lobby", onLobby);
        socket.on("error", onError);
        return () => {
            socket.off("updatetargetsessiondescriptions", onUpdateTargetSessionDescription);

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
            setPeerConnectionMap({})
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
