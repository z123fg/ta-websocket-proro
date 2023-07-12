import React, { useContext } from "react";
import UserContext from "../../contexts/userContext";
import { Link } from "react-router-dom";

const Header = () => {
    const { user, login, signup, signout } = useContext(UserContext);
    const isLogin = !(user === null);
    const handleSignout = () => {
        signout();
    };
    return (
        <header>
            {!isLogin ? (
                <>
                    <Link to="login">login</Link>
                    <Link to="signup">signup</Link>
                </>
            ) : (
                <button onClick={handleSignout}>signout</button>
            )}
        </header>
    );
};

export default Header;
