const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({ region: 'your-region' });

const bcrypt = require("bcrypt");

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: "Invalid username " });
      }
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }
      if (user && validPassword) {
        return res.status(200).json({ user });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };

  const signup = async (req, res) => {

    const { name, username, password } = req.body;
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const newUser = new User({
        name: name,
        username: username,
        password: hashedPassword,
      });
      const savedUser = await newUser.save();
      res.status(200).json(savedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };


  module.exports = {
    login,
    signup
  };