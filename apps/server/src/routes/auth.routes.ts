import { prismaClient } from "@repo/db";
import { signinSchema, signupSchema } from "../types/type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { Router } from "express";

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

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours — match JWT expiry
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Signin error:",
      error instanceof Error ? error.stack : error,
    );
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/signout", (req, res) => {
  // clearCookie must mirror the attributes the cookie was set with
  // (secure/sameSite/path) or the browser will not remove it.
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  return res.json({ success: true });
});

export default authRouter;
