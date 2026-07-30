import reviewModel from "../models/review.js";

const reviewController = {};

// SELECT
reviewController.getReviews = async (req, res) => {

  try {

    // Traemos todas las reviews
    const reviews = await reviewModel.find()
      .populate("productId")
      .populate("clientId");

    return res.status(200).json(reviews);

  } catch (error) {

    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

// INSERT
reviewController.insertReview = async (req, res) => {

  try {

    // Sacamos los datos que manda el front
    const {
      productId,
      clientId,
      rating
    } = req.body;

    // Validamos que no venga nada vacío
    if (!productId || !clientId || rating === undefined) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // El rating solo puede ser entre 1 y 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5"
      });
    }

    // Evitamos que un cliente califique dos veces el mismo producto
    const existingReview = await reviewModel.findOne({
      productId,
      clientId
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You already rated this product"
      });
    }

    // Creamos la review
    const newReview = new reviewModel({
      productId,
      clientId,
      rating
    });

    await newReview.save();

    return res.status(201).json({
      message: "Review created successfully"
    });

  } catch (error) {

    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

// UPDATE
reviewController.updateReview = async (req, res) => {

  try {

    const { rating } = req.body;

    // Validamos que venga el rating
    if (rating === undefined) {
      return res.status(400).json({
        message: "Rating is required"
      });
    }

    // Debe ser un número entre 1 y 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5"
      });
    }

    // Buscamos la review
    const reviewFound = await reviewModel.findById(req.params.id);

    if (!reviewFound) {
      return res.status(404).json({
        message: "Review not found"
      });
    }

    await reviewModel.findByIdAndUpdate(
      req.params.id,
      { rating },
      { new: true }
    );

    return res.status(200).json({
      message: "Review updated successfully"
    });

  } catch (error) {

    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

// DELETE
reviewController.deleteReview = async (req, res) => {

  try {

    const reviewFound = await reviewModel.findById(req.params.id);

    if (!reviewFound) {
      return res.status(404).json({
        message: "Review not found"
      });
    }

    await reviewModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Review deleted successfully"
    });

  } catch (error) {

    console.log("Error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

export default reviewController;