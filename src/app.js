import express from "express";
import path from "path";
import morgan from "morgan";
import userRoutes from "./routes/user.routes.js";
import publicacionRoutes from "./routes/publicacion.routes.js";
import offerRoutes from "./routes/offer.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// settings
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//globals variables
app.locals.emailCookie = "empty@gmail.com";
app.locals.roleCookie = "";

// routes
app.use(userRoutes);
app.use(publicacionRoutes);
app.use(offerRoutes);
app.use(transactionsRoutes);
app.use(notificationRoutes);

// static files
app.use(express.static(path.join(__dirname, "public")));

// starting the server
export default app;
