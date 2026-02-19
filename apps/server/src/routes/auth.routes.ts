import { prismaClient } from "@repo/db";
import { signinSchema, signupSchema } from "../types/type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import express from "express";
import { Response, Request, NextFunction, Router } from "express";

const app = express();

app.use(express.json());

const authRouter: Router = Router();

authRouter.post("/signup", async (req, res) => {
  const parsedBody = signupSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ error: "Wrong Credentials" });
    return;
  }

  try {
    const password = parsedBody.data.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prismaClient.user.create({
      data: {
        name: parsedBody.data.username,
        email: parsedBody.data.email,
        password: hashedPassword,
      },
    });

    return res.json({
      user: user.id,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res
      .status(400)
      .json({ error: "User already exists or invalid data" });
  }
});

authRouter.post("/signin", async (req, res) => {
  const parsedBody = signinSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({ error: "Invalid credentials format" });
    return;
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: parsedBody.data.email,
      },
    });

    if (!user) {
      res.status(401).json({ error: "User does not exist" });
      return;
    }

    const passwordValid = await bcrypt.compare(
      parsedBody.data.password,
      user.password,
    );

    if (!passwordValid) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set in environment variables!");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, {
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
