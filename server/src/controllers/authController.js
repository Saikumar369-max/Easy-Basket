const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const model = require('../models/User');
const router = express.Router();

const genreateToken = (user) => {
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    return token;
};
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    return refreshToken;
};

const register = async (req, res) => {
    try {
        const { name, email, password, role, address } = req.body;
        const user = await model.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new model({
            name,
            email,
            password: hashedPassword,
            role,
            address
        });
        await newUser.save();
        const token = genreateToken(newUser);
        const refreshToken = generateRefreshToken(newUser);
        newUser.refreshToken = refreshToken;
        await newUser.save();
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure: true,
            // sameSite: "strict",
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({ message: "user registered successfully", token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const founduser = await model.findOne({ email });
        if (!founduser) {
            return res.status(400).json({ message: "Invalid credentails" });
        }
        const ismatch = await bcrypt.compare(password, founduser.password);
        if (!ismatch) {
            return res.status(400).json({ message: "Invalid credentails" })
        }
        const token = genreateToken(founduser);
        const refreshToken = generateRefreshToken(founduser);
        founduser.refreshToken = refreshToken;
        await founduser.save();
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            // secure: true,
            // sameSite: "strict",
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        res.status(200).json({
            message: "user logged in successfully",
            token,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const refreshToken = async (req, res) => {
    const reftoken = req.cookies.refreshToken;
    if (!reftoken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }
    try {
        const decoded = jwt.verify(reftoken, process.env.JWT_REFRESH_SECRET);
        const user = await model.findById(decoded.id);

        const newtoken = genreateToken(user);
        return res.status(200).json({ accesstoken: newtoken });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const logout = async (req, res) => {
    const reftoken = req.cookies.refreshToken;
    if (!reftoken) {
        return res.status(204).json({ message: "No content" });
    }
    const user = await model.findOne({ refreshToken: reftoken });

    if (user) {
        user.refreshToken = null;
        await user.save();
    }
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "logged out successfully" });
};

module.exports = { register, login, refreshToken, logout };