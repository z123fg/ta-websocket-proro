import { MouseEvent } from "react";

export interface UserInfo {
    username: string | null;
    token:  string | null;
    userId:  string | null;
}

export interface IAuthForm {
    username: string;
    password: string;
}

export interface IUserContext {
    user: UserInfo;
    login: (user: IAuthForm) =>void;
    signup: (user: IAuthForm) =>void;
    signout: (user: IAuthForm) =>void;
    pc: RTCPeerConnection
}