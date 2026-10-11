import express from "express";
import { ticketRoutes } from "./tickets/ticket.routes";
import { errorHandler } from "./middleware/error-handler";

export const app = express();
app.use(express.json({ limit: "64kb" }));
app.use("/tickets", ticketRoutes);
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});
app.use(errorHandler);

export default app;
