import React, { useContext } from "react";
import logo from "./logo.svg";
import "./App.css";
import Header from "./components/Header/Header";
import UserProvider from "./providers/UserProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import Home from "./components/Home/Home";
import UserContext from "./contexts/userContext";

function App() {
    const context = useContext(UserContext);
    return (
        <>
            <Header />
            <Routes>
                <Route
                    path="/"
                    element={
                        context.user === null ? (
                            <Navigate to="/login" />
                        ) : (
                            <Home {...{ ...context, user: context.user! }} />
                        )
                    }
                />
                <Route path="/home" element={<Navigate to={"/"} />} />
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
            </Routes>
            <div id="inspect"></div>
        </>
    );
}

export default App;
