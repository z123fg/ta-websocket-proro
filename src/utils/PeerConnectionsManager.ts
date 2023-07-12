import { User } from "../components/Home/Home";
import { Socket, io } from "socket.io-client";
import { UserInfo } from "../types/types";
import { ILDMap, IPCMap, ISD } from "../hooks/usePeerConnection";
import { PeerConnection } from "./PeerConnection";

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
        this._me = newRoomUsers.find((user) => user.id === this._curUser.userId) || null;
        this._exclusiveRoomUsers = newRoomUsers.filter(
            (user) => !!this._me?.room && user.id !== this._curUser.userId
        );
        this._updatePCMap();
    };

    //get socket(){return this._socket}
    private removeUnusedPC() {
        const exclusiveRoomUsersSet = new Set(this._exclusiveRoomUsers.map((user) => user.id));
        Object.entries(this.PCMap).forEach(([target, pc]) => {
            if (!exclusiveRoomUsersSet.has(+target)) {
                pc.clear();
                delete this.PCMap[target];
            }
        });
    }

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
                const pc = new PeerConnection(owner, target, this.onUpdateLD);
                newPCMap[target] = pc;
                if (owner > target) pc.initMaster();
            }
        });
        this.PCMap = newPCMap;
    }
    updateSocket = (newSocket: Socket | null) => {
        console.log("updatesocket", newSocket);
        this._socket = newSocket;
    };

    updateCurUser = (newCurUser: UserInfo) => {
        this._curUser = newCurUser;
    };

    updateSDs = (SDs: ISD[]) => {
        console.log("updateSDs");
        this._SDs = SDs;
        SDs.forEach((SD) => {
            const target = +SD.target.id;
            const owner = +SD.owner.id;
            if (target !== this._me?.id) return;
            if (target === owner) throw Error("target and owner can't be the same");
            const isMaster = target > owner;
            const pc = this.PCMap[owner];
            if (!!!pc) {
                throw Error("receive session description before user enter the room!");
            } else {
                if (isMaster) {
                    pc.connect(SD.sessionDescriptionString);
                } else {
                    //console.log("initSlave", SD);
                    pc.initSlave(SD.sessionDescriptionString);
                }
            }
        });
    };

    private onUpdateLD = (target: number, LD: string) => {
        console.log("updateld", this._socket);
        this._socket?.emit("updatelds", { [target]: LD });
    };
}

export default PeerConnectionsManager;
