import { Principal } from "../models/principal.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateTokens = (principal) => {
  const accessToken = jwt.sign(
    { id: principal._id, role: "principal" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
  );

  const refreshToken = jwt.sign(
    { id: principal._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const REGISTER_PRINCIPAL = async (req, res) => {
  try {
    const { name, email, password, yearsOfExperience } = req.body;

    // Check if email already exists
    const existingPrincipal = await Principal.findOne({ email });
    if (existingPrincipal) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new principal
    const newPrincipal = new Principal({
      name,
      email,
      password: hashedPassword,
      yearsOfExperience,
    });

    await newPrincipal.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(newPrincipal);

    res.status(201).json({
      message: "Principal registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const LOGIN_PRINCIPAL = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the principal exists
    const principal = await Principal.findOne({ email });
    if (!principal) {
      return res.status(404).json({ message: "Principal not found" });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, principal.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        _id: principal._id,
        email: principal.email,
        role: principal.role,
      },
      process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
      { expiresIn: "1h" } // Token expiration time
    );

    // Respond with the token and principal details (excluding password)
    res.status(200).json({
      message: "Login successful",
      token,
      principal: {
        _id: principal._id,
        name: principal.name,
        email: principal.email,
        role: principal.role,
        yearsOfExperience: principal.yearsOfExperience,
      },
    });
  } catch (error) {
    console.error("Error logging in principal:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
