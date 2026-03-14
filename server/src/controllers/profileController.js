const express = require('express');
const User = require('../models/User');


const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = getProfile;

