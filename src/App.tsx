import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Header from "./components/Header/Header";
import UserProvider from "./providers/UserProvider";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import Home from "./components/Home/Home";

function App() {
    return (
        <BrowserRouter>
            <UserProvider>
                <Header />
                <Routes>
                  <Route path="/" element={<Home/>}/>
                  <Route path="/home" element={<Navigate to={"/"}/>}/>
                  <Route path="login" element={<Login/>}/>
                  <Route path="signup" element={<Signup/>}/>
                </Routes>
            </UserProvider>
        </BrowserRouter>
    );
}

export default App;
