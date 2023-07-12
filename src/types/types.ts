import { MouseEvent } from "react";

export interface UserInfo {
    username: string;
    token:  string ;
    userId:  number;
}

export interface IAuthForm {
    username: string;
    password: string;
}

export interface IUserContext {
    user: UserInfo|null;
    login: (user: IAuthForm) =>void;
    signup: (user: IAuthForm) =>void;
    signout: () =>void;
}