import { Router } from "express";
import {
    renderNotification,
    deleteNotification,
    toggleLike
} from "../controllers/notificationController.js";

const router = Router();

router.get("/renderNotification", renderNotification);
router.get("/deleteNotification/:id", deleteNotification);
router.post("/toggle-like", toggleLike);
//router.post("/renderMakeOffer/createOffer/:id", createOffer);

export default router;