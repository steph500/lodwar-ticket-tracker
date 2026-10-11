import { Router } from "express";
import * as controller from "./ticket.controller";

export const ticketRoutes = Router();
ticketRoutes.post("/", controller.createTicket);
ticketRoutes.get("/", controller.listTickets);
ticketRoutes.get("/stats", controller.getStats);
ticketRoutes.patch("/:id", controller.updateTicket);
