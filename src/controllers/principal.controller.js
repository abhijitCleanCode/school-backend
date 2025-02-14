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
