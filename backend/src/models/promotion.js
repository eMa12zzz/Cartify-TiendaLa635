import mongoose, { Schema, model } from "mongoose";

/*
 Promoción / Anuncio de la tienda — soporta 3 tipos:
   - 'descuento'    : cada producto con SU % de descuento.       (items[].discount)
   - 'precio_fijo'  : cada producto con un precio fijo de oferta. (items[].fixedPrice)
   - 'nxm'          : compra N, paga M sobre los productos.       (buyQty/payQty)

   items:   productos incluidos (+ su descuento/precio según el tipo).
   image:   banner que sube la tienda (Cloudinary). Click → filtra a estos productos.
*/
const promoItemSchema = new Schema(
  {
    // ref = nombre del MODELO registrado ('productModel'), no el de la colección.
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "productModel" },
    discount: { type: Number, default: 0 },   // % (tipo 'descuento')
    fixedPrice: { type: Number },              // $ (tipo 'precio_fijo')
    /*
     * De dónde salió este producto. Si se agregó eligiendo una categoría
     * completa, se guarda cuál: la promo queda con los productos uno por uno
     * (una foto del momento), pero el admin ve "Lácteos · 12 productos" en vez
     * de doce filas sueltas y puede quitarlos de un golpe.
     *
     * Es una foto a propósito: si fuera dinámica, un producto agregado mañana
     * a esa categoría entraría a la promo sin que nadie lo haya visto ni
     * revisado su precio.
     */
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "productTypeModel" },
    categoryName: { type: String },
  },
  { _id: false }
);

const promotionSchema = new mongoose.Schema(
  {
    title: { type: String },
    image: { type: String },
    public_id: { type: String },
    promoDescription: { type: String, required: true },
    type: {
      type: String,
      enum: ["descuento", "precio_fijo", "nxm"],
      default: "descuento",
    },
    items: [promoItemSchema],
    buyQty: { type: Number, default: 2 }, // NxM: compra N
    payQty: { type: Number, default: 1 }, // NxM: paga M
    /*
     * Diseño del banner. Antes la IA armaba una imagen en canvas y se subía a
     * Cloudinary; ahora la tarjeta se dibuja con estos valores, así que se
     * puede editar cuando sea sin regenerar nada, el texto queda nítido en
     * cualquier pantalla y no se gasta almacenamiento en imágenes.
     *
     * La imagen sigue existiendo por si la tienda diseñó su propio banner:
     * si la sube, manda ella y estos colores no se usan.
     */
    tema: { type: String, default: 'cafe' },   // paleta elegida (ver temasPromo)
    colorFondo: { type: String },              // hex, solo si eligió "personalizado"
    colorFondo2: { type: String },             // segundo color: arma el degradado
    colorTexto: { type: String },
    colorAcento: { type: String },             // píldora de la etiqueta
    colorFlecha: { type: String },             // círculo de la flecha; si falta, usa el acento
    /*
     * Icono del banner (ver iconosPromo). Se dibuja en la píldora y en grande
     * de marca de agua, para que el banner tenga cara sin depender de una foto.
     */
    icono: { type: String, default: '' },
    /*
     * Si la tienda diseñó su propio banner entero (1200×480), la imagen ocupa
     * toda la tarjeta y el texto no se dibuja encima. En falso —lo normal— la
     * imagen acompaña a un lado y el título sigue leyéndose.
     */
    imagenCompleta: { type: Boolean, default: false },

    /*
     * Vencimiento (opcional). Al pasar la fecha la promo deja de aplicarse y de
     * anunciarse sola: nadie tiene que acordarse de apagarla un domingo.
     * Se guarda al FINAL del día elegido, así "vence el 3" incluye todo el 3.
     */
    endsAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
    /*
     * ¿Se anuncia en la tienda con banner?
     * Si va en false, la promo SIGUE aplicando su descuento en los precios y en
     * el carrito, pero no aparece en el carrusel. Sirve para descuentos
     * silenciosos (liquidar algo sin publicarlo).
     */
    showBanner: { type: Boolean, default: true },
  },
  { timestamps: true, strict: false }
);

export default model('promotionModel', promotionSchema, 'Promotions');
