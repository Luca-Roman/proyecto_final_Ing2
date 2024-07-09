import { Router } from "express";
import {
  createPublicacion,
  createNewPublicacion,
  verifyPublication,
  acceptedPublication,
  declinedPublication,
  renderPublications,
  deletePublication,
  renderUserPosts,
  editPublication,
  saveEditPublication,
  searchPublication,
  filterPublications,
  orderPublications,
  renderFavourite
} from "../controllers/publicacionController.js";
const router = Router();

router.get("/createPublication", createPublicacion);
router.post("/createPublication/new", createNewPublicacion);
router.get("/verifyPublication", verifyPublication);
router.get("/accepted/:id", acceptedPublication);
router.get("/declined/:id", declinedPublication);
router.get("/renderPublications", renderPublications);
router.get("/deletePublication/:id", deletePublication);
router.get("/renderUserPosts", renderUserPosts);
router.get("/editPublication/:id", editPublication);
router.get("/renderFavourite", renderFavourite);
router.post("/saveEditPublication", saveEditPublication);
router.post("/searchPublication", searchPublication)
router.post("/filterPublications", filterPublications)
router.post("/orderPublications", orderPublications)
export default router;
