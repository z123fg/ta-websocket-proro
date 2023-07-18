import { User } from "../components/Home/Home";
import { Socket, io } from "socket.io-client";
import { UserInfo } from "../types/types";
import { PeerConnection } from "./PeerConnection";
import { SDMessage } from "../components/Home/Home";
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
class PeerConnectionsManager {
    private _socket: Socket | null = null;
    private _me: User | null = null;
    private _roomUsers: User[] = [];
    private _curUser: UserInfo;
    PCMap: IPCMap = {};
    private _exclusiveRoomUsers: User[] = [];
    private _SDs: ISD[] = [];

    constructor(curUser: UserInfo, socket: Socket | null) {
        this._curUser = curUser;
        this._socket = socket;
    }

    updateRoomUsers = (newRoomUsers: User[]) => {
        this._roomUsers = newRoomUsers;
        this._me =
            newRoomUsers.find((user) => user.id === this._curUser.userId) ||
            null;
        this._exclusiveRoomUsers = newRoomUsers.filter(
            (user) => !!this._me?.room && user.id !== this._curUser.userId
        );
        this._updatePCMap();
    };
    private _updatePCMap() {
        const newPCMap: IPCMap = {};
        const owner = +this._curUser.userId;
        this.removeUnusedPC();
        this._exclusiveRoomUsers.forEach((user) => {
            const target = +user.id;
            const curPC = this.PCMap[target];
            if (!!curPC) {
                newPCMap[target] = curPC;
            } else {
                const pc = new PeerConnection(owner, target);
                newPCMap[target] = pc;
                console.log("ismaster", owner, target);
                if (owner > target) pc.initMaster();
            }
        });
        this.PCMap = newPCMap;
    }

    //get socket(){return this._socket}
    private removeUnusedPC() {
        const exclusiveRoomUsersSet = new Set(
            this._exclusiveRoomUsers.map((user) => user.id)
        );
        Object.entries(this.PCMap).forEach(([target, pc]) => {
            if (!exclusiveRoomUsersSet.has(+target)) {
                pc.clear();
                delete this.PCMap[target];
            }
        });
    }

    updateSD(message: SDMessage) {
        const { ownerId, SD, type } = message;
        const pc = this.PCMap[ownerId];
        const targetId = this._curUser.userId;
        if (+ownerId > +targetId && type === "offer") {
            pc.initSlave(SD);
        } else if (+ownerId < +targetId && type === "answer") {
            pc.connect(SD);
        } else {
            throw Error("target and owner cannot be the same!");
        }
    }

    updateSocket = (newSocket: Socket | null) => {
        console.log("updatesocket", newSocket);
        this._socket = newSocket;
        PeerConnection.emit = (e: string, data: any) => {
            newSocket?.emit(e, data);
        };
    };

    updateCurUser = (newCurUser: UserInfo) => {
        this._curUser = newCurUser;
    };
}

export default PeerConnectionsManager;
