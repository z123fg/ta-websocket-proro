import { createContext } from "react";
import { IUserContext } from "../types/types";
const initValue = {
    user:null,
    login: () => {},
    signup: () => {},
    signout: () => {}
}

const UserContext = createContext<IUserContext>(initValue);


export default UserContext
