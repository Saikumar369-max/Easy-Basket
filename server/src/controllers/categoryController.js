const express = require('express');
const router = express.Router();

const category = require('../models/Category');

const getCategories = async (req, res) => {
    try {
        const categories = await category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getCategories,
    getCategoryById
};