import express from "express";
import reviewController from "../controller/reviewController.js";

const router = express.Router();

router
  .route("/")
  .post(reviewController.upsert);

router
  .route("/:productId")
  .get(reviewController.getByProduct)
  .delete(reviewController.remove);

export default router;
