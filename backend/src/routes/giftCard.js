import express from 'express';
import giftCardController from '../controller/giftCardController.js';

const router = express.Router();

// Admin: crear y listar tarjetas.
router.route("/")
    .get(giftCardController.getGiftCards)
    .post(giftCardController.insertGiftCard);

// Cliente: canjear un código y consultar su saldo.
router.route("/redeem")
    .post(giftCardController.redeemGiftCard);

router.route("/balance/:clientId")
    .get(giftCardController.getBalance);

router.route("/:id")
    .delete(giftCardController.deleteGiftCard);

export default router;
