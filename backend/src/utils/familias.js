/*
 * ============================================================
 * FAMILIAS DE PRODUCTOS (lista cerrada) — familias.js
 * ============================================================
 * Los estantes que de verdad tiene una tienda de barrio salvadoreña. El backend
 * la necesita para UNA cosa: revisar lo que devuelve la IA. Al modelo se le
 * manda esta lista y se le prohíbe salirse de ella, pero eso es un pedido, no
 * una garantía — si contesta con una familia que no está aquí, se descarta en
 * silencio. Nunca se guarda en la base algo que el modelo se inventó.
 *
 * OJO: esta lista está DUPLICADA en frontend/src/utils/familias.js. Es a
 * propósito: en este repo el frontend y el backend no comparten código, y
 * tenerla dos veces es menos malo que montar un paquete compartido para 28
 * líneas. Lo que NO se puede es desincronizarlas — si agregás o renombrás una
 * clave, hacelo en los dos archivos el mismo día o el backend empezará a
 * botar en silencio lo que el frontend sí espera.
 *
 * El léxico de palabras clave (los "red bull", "quesillo", "guisquil") vive
 * solo en el frontend, porque la clasificación por reglas corre allá. Aquí
 * únicamente hacen falta las claves, los títulos y un ejemplo de cada estante
 * para que el modelo entienda qué se guarda en cada uno.
 * ============================================================
 */

export const FAMILIAS = [
  { clave: "bebidas-energizantes", titulo: "Bebidas energizantes", ejemplo: "Red Bull, Monster, Volt, Raptor" },
  { clave: "gaseosas", titulo: "Gaseosas", ejemplo: "Coca-Cola, Pepsi, Sprite, Salva Cola" },
  { clave: "jugos-y-nectares", titulo: "Jugos y néctares", ejemplo: "Del Valle, Petit, Tampico, néctares" },
  { clave: "aguas", titulo: "Aguas", ejemplo: "Agua Cristal, agua purificada, garrafas" },
  { clave: "hidratantes", titulo: "Bebidas hidratantes", ejemplo: "Gatorade, Powerade, suero oral" },
  { clave: "cervezas-y-licores", titulo: "Cervezas y licores", ejemplo: "Pilsener, Suprema, ron, vino" },
  { clave: "cafe-e-infusiones", titulo: "Café e infusiones", ejemplo: "Café Listo, Coscafé, té, manzanilla" },
  { clave: "lacteos", titulo: "Leches y lácteos", ejemplo: "Leche, yogurt, crema, cuajada" },
  { clave: "quesos", titulo: "Quesos", ejemplo: "Queso fresco, quesillo, mozzarella" },
  { clave: "snacks", titulo: "Snacks y frituras", ejemplo: "Diana, Takis, churritos, platanitos" },
  { clave: "galletas-y-dulces", titulo: "Galletas y dulces", ejemplo: "Oreo, chocolates, chicles, paletas" },
  { clave: "panaderia", titulo: "Panadería", ejemplo: "Pan francés, semita, quesadilla, Bimbo" },
  { clave: "cereales", titulo: "Cereales y avenas", ejemplo: "Corn Flakes, Zucaritas, avena, mosh" },
  { clave: "granos-basicos", titulo: "Granos básicos", ejemplo: "Arroz, frijol, maíz, azúcar, sal" },
  { clave: "aceites", titulo: "Aceites y grasas", ejemplo: "Aceite, manteca, margarina" },
  { clave: "pastas-y-sopas", titulo: "Pastas y sopas", ejemplo: "Espagueti, fideos, sopa Maggi, ramen" },
  { clave: "enlatados", titulo: "Enlatados", ejemplo: "Atún, sardinas, conservas en lata" },
  { clave: "salsas", titulo: "Salsas y aderezos", ejemplo: "Ketchup, mayonesa, mostaza, consomé" },
  { clave: "embutidos", titulo: "Embutidos", ejemplo: "Jamón, salchicha, chorizo, mortadela" },
  { clave: "carnes", titulo: "Carnes", ejemplo: "Pollo, carne molida, costilla, pescado" },
  { clave: "frutas", titulo: "Frutas", ejemplo: "Banano, sandía, jocote, aguacate" },
  { clave: "verduras", titulo: "Verduras", ejemplo: "Tomate, cebolla, güisquil, yuca" },
  { clave: "huevos", titulo: "Huevos", ejemplo: "Huevos por unidad o por cartón" },
  { clave: "limpieza", titulo: "Limpieza del hogar", ejemplo: "Cloro, detergente, Axion, escobas" },
  { clave: "cuidado-personal", titulo: "Cuidado personal", ejemplo: "Shampoo, pasta dental, papel higiénico" },
  { clave: "bebe", titulo: "Para el bebé", ejemplo: "Pañales, toallitas húmedas, fórmula" },
  { clave: "mascotas", titulo: "Mascotas", ejemplo: "Dog Chow, Whiskas, alimento para perro" },
  { clave: "papeleria", titulo: "Papelería", ejemplo: "Cuadernos, lápices, folders, tijeras" },
];

// Con esto se revisa lo que contesta el modelo, sin recorrer el arreglo entero.
export const CLAVES_VALIDAS = new Set(FAMILIAS.map((f) => f.clave));

export const esFamiliaValida = (clave) => CLAVES_VALIDAS.has(String(clave || ""));

/*
 * La lista tal como se le muestra al modelo. Va la clave (que es lo que tiene
 * que devolver) junto al título y unos ejemplos, porque "bebe" a secas no le
 * dice nada y "Para el bebé: pañales, fórmula" sí.
 */
export const LISTA_PARA_IA = FAMILIAS.map(
  (f) => `${f.clave} = ${f.titulo} (${f.ejemplo})`
).join("\n");
