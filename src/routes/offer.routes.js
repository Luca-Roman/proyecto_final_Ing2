import { Router } from "express";
import { 
    makeOfferPage, 
    createOffer,
    renderVehicles, 
    renderOffers,
    acceptOffer,
    denyOffer
} from "../controllers/offerController.js";

const router = Router();

router.get("/renderMakeOffer/:id", makeOfferPage);
router.post("/renderMakeOffer/createOffer/:id", createOffer);
router.get("/renderVehicles", renderVehicles);
router.get("/renderOfertas", renderOffers);
router.get("/acceptOffer/:id", acceptOffer);
router.get("/denyOffer/:id", denyOffer);

export default router;