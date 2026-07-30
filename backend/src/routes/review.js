import express from "express";
import reviewController from "../controller/review.js";

const router = express.Router();

router.route("/")
    .get(reviewController.getReviews)
    .post(reviewController.insertReview);

router.route("/:id")
    .put(reviewController.updateReview)
    .get(reviewController.getReview)
    .delete(reviewController.deleteReview);

export default router;