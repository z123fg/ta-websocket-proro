import { createContext } from "react";
import { IUserContext } from "../types/types";
const initValue = {
    user:{
        userId:null,
        username:null,
        token: null,
    },
    login: () => {},
    signup: () => {},
    signout: () => {},
    
}

const UserContext = createContext<IUserContext>(initValue);


export default UserContext
