import { Router } from "express";
import { 
    renderofferstoverify, 
    acceptTransaction,
    denyTransaction
} from "../controllers/transactionController.js";

const router = Router();

router.get("/renderofferstoverify", renderofferstoverify);
router.get("/acceptTransaction/:id", acceptTransaction);
router.get("/denyTransaction/:id", denyTransaction);

export default router;