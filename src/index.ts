import amqp from "amqplib";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import supertokens from "supertokens-node";
import EmailPassword, { signIn } from "supertokens-node/recipe/emailpassword";
import { middleware, errorHandler } from "supertokens-node/framework/express";
import {
  getUserMetadata,
  updateUserMetadata,
} from "supertokens-node/recipe/usermetadata";
import { getApiDomain, getWebsiteDomain, SuperTokensConfig } from "./config";
import { PurchaseEvent, UserMetadata } from "./types";
import verifyToken from "./middleware";
import { epochToTimestamp } from "./utils";
import { getPurchasesByCustomerId, processPurchaseEvent } from "./db";

dotenv.config();

supertokens.init(SuperTokensConfig);
const app = express();

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: [getApiDomain(), getWebsiteDomain()],
  methods: ["GET", "PUT", "POST", "DELETE", "HEAD", "PATCH"],
  allowedHeaders: [
    "content-type",
    "Authorization",
    ...supertokens.getAllCORSHeaders(),
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// This exposes all the APIs from SuperTokens to the client.
app.use(middleware());

app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// Health check route
app.get("/", async (_req, res) => {
  res.send("NovelNest: User Service is running!");
});

// Route: POST /api/auth/signup (Signup)
app.post("/api/auth/register", async (req, res): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    let response = await EmailPassword.signUp("public", email, password);

    if (response.status === "EMAIL_ALREADY_EXISTS_ERROR") {
      return res.status(409).json({
        error: "Email already exists. Please use a different email address.",
      });
    } else if (response.status !== "OK") {
      return res
        .status(400)
        .json({ error: "Signup failed. Please try again." });
    }

    // Store additional metadata
    await updateUserMetadata(response.user.id, {
      username,
    });

    console.log("✅ User registered successfully:", response.user.id);

    return res.status(201).json({
      message: "User registered successfully",
      userId: response.user.id,
      username: username,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});

// Route: POST /api/auth/login (Login)
app.post("/api/auth/login", async (req, res): Promise<any> => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please enter both email and password." });
  }
  try {
    const user = await signIn("public", email, password);
    if (user.status !== "OK") {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const metadata = await getUserMetadata(user.user.id);
    const userMetadata = metadata.metadata as UserMetadata;

    console.log(
      "✅ User logged in successfully:",
      user.user.id,
      userMetadata.username
    );

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in the environment variables");
    }
    const token = jwt.sign({ userId: user.user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    return res.status(200).json({
      message: "Login successful",
      userId: user.user.id,
      username: userMetadata.username,
      token: token,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "An unexpected error occurred. Please try again later." });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  // For JWT-based logout, clear the token on the client-side (localStorage, cookies, etc.)
  // Here we just send a response indicating successful logout
  res.status(200).json({ message: "Logout successful" });
});

// Route: GET /api/auth/user (Fetch user details)
app.get("/api/auth/user", verifyToken, async (req, res): Promise<any> => {
  try {
    // Assuming verifyToken ensures req.user exists
    const user = await supertokens.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const metadata = await getUserMetadata(req.user!.userId);
    const userMetadata = metadata.metadata as UserMetadata;

    res.status(200).json({
      userId: user.id,
      username: userMetadata.username,
      email: user.emails[0],
      createDate: epochToTimestamp(user.timeJoined),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An unexpected error occurred. Please try again later.",
    });
  }
});

// Route: GET /api/user/purchases (Fetch purchases for a user)
app.get("/api/user/purchases", verifyToken, async (req, res): Promise<any> => {
  const customer_id = req.user.userId;

  try {
    const purchases = await getPurchasesByCustomerId(customer_id);
    if (purchases.length === 0) {
      throw new Error("No purchases found for this user");
    }

    const formattedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      order_id: purchase.orderId,
      customer_id: purchase.customerId,
      book_id: purchase.bookId,
      book_title: purchase.bookTitle,
      book_author: purchase.bookAuthor,
      book_genre: purchase.bookGenre,
      order_status: purchase.orderStatus,
      purchase_date: purchase.purchaseDate,
    }));

    console.log("✅ Successfully fetched purchases for user");
    res.status(200).json({ success: true, data: formattedPurchases });
  } catch (error: any) {
    console.error("❌ Error fetching purchases for user:", error);

    // Return 404 status code if no orders are found
    if (error.message === "No purchases found for this user") {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: error?.message });
  }
});

// In case of session related errors, this error handler
// returns 401 to the client.
app.use(errorHandler());

// Function to consume messages
const QUEUE_NAME = process.env.QUEUE_NAME || "orders";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
async function consumeMessages() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(
      `✅ User-Service Consumer is listening on queue: ${QUEUE_NAME}`
    );

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const event: PurchaseEvent = JSON.parse(msg.content.toString());
          console.log(`📥 Received event:`, event);
          await processPurchaseEvent(event);
          channel.ack(msg);
        } catch (error) {
          console.error("❌ Message Processing Error:", error);
          channel.nack(msg, false, true); // Requeue the message
        }
      }
    });
  } catch (error) {
    console.error("❌ RabbitMQ Connection Error:", error);
    setTimeout(consumeMessages, 5000); // Retry after 5s
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 User Service is running on http://localhost:${PORT}`);
});

// Start consuming messages
consumeMessages();
