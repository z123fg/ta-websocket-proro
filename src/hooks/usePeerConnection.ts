import { User } from "../components/Home/Home";
import { useEffect, useMemo, useRef, useCallback } from "react";
import { UserInfo } from "../types/types";
import { Socket, io } from "socket.io-client";
import { PeerConnection } from "../utils/PeerConnection";
import { debounce } from "lodash";
import { prettyPrint } from "prettier-print";

export interface ISD {
    id: string;
    sessionDescriptionString: string;
    target: { id: number; room: { id: string; roomName: string } };
    owner: { id: number; room: { id: string; roomName: string } };
}
export interface IPCMap {
    [id: string]: PeerConnection;
}
export interface ILDMap {
    [target: string]: string;
}
PeerConnection.server = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
    ],
    iceCandidatePoolSize: 10,
};


const usePeerConnection = (onlineUsers: User[], curUser: UserInfo, socket: Socket | null) => {
//     const PCMapRef = useRef<IPCMap>({});
//     const LDRef = useRef<ILDMap>({});
//     const debouncedSendLDs = useCallback(
//         debounce(() => {
//             socket?.emit("updatelds", LDRef.current);
//         }, 1000),
//         [socket]
//     );
//     const me = useMemo(() => {
//         return onlineUsers.find((user) => user.id === curUser.userId)!;
//     }, [onlineUsers, curUser]);
//     const debouncedHandleUpdateSDs = useCallback(
//         debounce((SDs: ISD[]) => {
//             const roomSDs = SDs.filter((SD) => SD.owner.room.id === me?.room?.id && SD.target.id === me.id);
//             //prettyPrint(null, SDs, roomSDs);
//             const PCMap = PCMapRef.current;
//             console.log("sds", SDs, me, roomSDs);
//             roomSDs.forEach((SD) => {
//                 const owner = +SD.owner.id;
//                 const target = +me.id;
//                 const pc = PCMap[owner];
//                 if (!!pc) {
//                     if (pc.isMaster) {
//                         console.log("connect");
//                         pc.connect(SD.sessionDescriptionString);
//                     } else {
//                         pc.initSlave(SD.sessionDescriptionString);
//                     }
//                 } else {
//                     console.log("slave", owner, target);
//                     if (owner < target) console.error("wrong relationship, unknown reason");
//                     console.log("sd", SD);
//                     PCMap[owner] = new PeerConnection(target, owner, {
//                         offer: SD.sessionDescriptionString,
//                         onUpdateLD: (target: number, LD: string) => {socket?.emit("updatelds", {[target]: LD});},
//                     });
//                 }
//             });
//         }, 1000),
//         [me]
//     );
//     const roomUsers = useMemo(() => {
//         return onlineUsers.filter((user) => me?.room?.id && user?.room?.id === me?.room.id);
//     }, [onlineUsers, me]);
//     useEffect(() => {
//         if (!!!socket || !!!curUser) return;
//         const newRoomUsers = roomUsers.map((user) => ({ ...user, id: "" + user.id }));

//         const newPCMap: IPCMap = {};
//         const oldPCMap = PCMapRef.current;
//         const totalIdSet = new Set([...Object.keys(oldPCMap), ...newRoomUsers.map((user) => user.id)]);
//         totalIdSet.forEach((id) => {
//             if (id in oldPCMap) {
//                 if (newRoomUsers.find((user) => user.id === id)) {
//                     newPCMap[id] = oldPCMap[id];
//                 } else {
//                     console.log("clear");
//                     oldPCMap[id].clear();
//                 }
//             } else {
//                 if (newRoomUsers.find((user) => user.id === id)) {
//                     const target = +id;
//                     const owner = +me.id;
//                     if (owner > target) {
//                         newPCMap[target] = new PeerConnection(owner, target, { onUpdateLD: (target: number, LD: string) => {socket?.emit("updatelds", {[target]: LD});} });
//                     }
//                 }
//             }
//         });
//         PCMapRef.current = newPCMap;
//     }, [roomUsers, socket]);

//    /*  const handleUpdateLDs = (target: number, LD: string) => {
//         LDRef.current[target] = LD;
//         debouncedSendLDs();
//     }; */
//     useEffect(() => {
//         const interval = setInterval(() => {
//             prettyPrint(
//                 null,
//                 Object.entries(PCMapRef.current).map(([target, pc]) => {
//                     return { target, state: pc.state, isMaster: pc.isMaster, ld: pc.LD, rd: pc.RD };
//                 })
//             );
//         }, 1000);
//         return () => clearInterval(interval);
//     }, []);

//     useEffect(() => {
//         if (!!!socket || !!!curUser) return;
//         const handleUpdateSDs = (SDs: ISD[]) => {
//             const roomSDs = SDs.filter((SD) => SD.owner.room.id === me?.room?.id && SD.target.id === me.id);
//             //prettyPrint(null, SDs, roomSDs);
//             const PCMap = PCMapRef.current;
//             console.log("sds", SDs, me, roomSDs);
//             roomSDs.forEach((SD) => {
//                 const owner = +SD.owner.id;
//                 const target = +me.id;
//                 const pc = PCMap[owner];
//                 if (!!pc) {
//                     if (pc.isMaster) {
//                         console.log("connect");
//                         pc.connect(SD.sessionDescriptionString);
//                     } else {
//                         pc.initSlave(SD.sessionDescriptionString);
//                     }
//                 } else {
//                     console.log("slave", owner, target);
//                     if (owner < target) console.error("wrong relationship, unknown reason");
//                     console.log("sd", SD);
//                     PCMap[owner] = new PeerConnection(target, owner, {
//                         offer: SD.sessionDescriptionString,
//                         onUpdateLD: (target: number, LD: string) => {socket?.emit("updatelds", {[target]: LD});},
//                     });
//                 }
//             });
//         }
//         socket.on("updatesds", handleUpdateSDs);

//         return () => {
//             socket.off("updatesds", handleUpdateSDs);
//         };
//     }, [socket, me]);
};

export default usePeerConnection;
