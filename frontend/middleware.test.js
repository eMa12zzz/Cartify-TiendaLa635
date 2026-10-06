import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import middleware, { config } from './middleware.js';

/*
 * La vista previa de los enlaces (middleware.js, en Vercel). Se prueba con
 * un servidor de mentira: el producto y la página salen de aquí, no de
 * internet.
 */

const ORIGEN = 'https://cartify-tienda-la635.vercel.app';
const FRESAS = '6a66fd61802fdcc013afb642';
const INDEX = `<!doctype html><html><head>
    <meta name="description" content="general" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Tienda la 635" />
    <meta property="og:description" content="general" />
    <meta property="og:url" content="${ORIGEN}/" />
    <meta property="og:image" content="${ORIGEN}/compartir.jpg" />
    <meta property="og:image:alt" content="Tiqui" />
    <title>Tienda la 635</title>
  </head><body></body></html>`;

const PRODUCTO = {
  _id: FRESAS,
  name: 'Fresas',
  salePrice: 4.65,
  unidadVenta: 'libra',
  image: ['https://res.cloudinary.com/x/image/upload/v1/grupo1B/fresas.webp'],
  brandId: { name: 'Del Campo' },
  typeId: { type: 'Frutas' },
};

const UA = {
  whatsapp: 'WhatsApp/2.24.10.79 A',
  persona: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
};

const pedir = (ruta, ua) => middleware(new Request(ORIGEN + ruta, { headers: { 'user-agent': ua } }));
const siguioDeLargo = (r) => r.headers.get('x-middleware-next') === '1';

describe('vista previa de los enlaces', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const u = String(url);
      if (u.endsWith('/index.html')) return new Response(INDEX);
      if (u.endsWith(`/product/${FRESAS}`)) return Response.json(PRODUCTO);
      if (/\/product\/[a-f0-9]{24}$/.test(u)) return Response.json({ message: 'Ese producto no existe' }, { status: 404 });
      if (u.endsWith('/product')) return Response.json([{ ...PRODUCTO, updatedAt: '2026-10-04T15:02:32.198Z' }, { _id: 'b'.repeat(24), isActive: false }]);
      return new Response('', { status: 404 });
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('solo atiende los productos y el sitemap', () => {
    expect(config.matcher).toEqual(['/producto/:path*', '/sitemap.xml']);
  });

  it('a WhatsApp le da la foto, el nombre y el precio del producto', async () => {
    const r = await pedir(`/producto/${FRESAS}`, UA.whatsapp);
    expect(siguioDeLargo(r)).toBe(false);
    const html = await r.text();
    expect(html).toContain('<title>Fresas · Tienda la 635</title>');
    expect(html).toContain('<meta property="og:title" content="Fresas · Tienda la 635" />');
    expect(html).toContain('$4.65 la libra · Del Campo · Frutas');
    expect(html).toContain('/image/upload/f_jpg,q_auto,c_pad,w_1200,h_630,b_rgb:FFFFFF/v1/grupo1B/fresas.webp');
    expect(html).toContain(`<link rel="canonical" href="${ORIGEN}/producto/${FRESAS}" />`);
    expect(html).toContain('<meta property="product:price:amount" content="4.65" />');
  });

  it('a una persona la deja pasar directo a la tienda, sin esperar al servidor', async () => {
    const r = await pedir(`/producto/${FRESAS}`, UA.persona);
    expect(siguioDeLargo(r)).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('un producto que no existe se queda con la vista general', async () => {
    expect(siguioDeLargo(await pedir(`/producto/${'0'.repeat(24)}`, UA.whatsapp))).toBe(true);
  });

  it('una dirección rota no se toca', async () => {
    expect(siguioDeLargo(await pedir('/producto/no-es-un-id', UA.whatsapp))).toBe(true);
  });

  it('si el servidor no contesta, nunca devuelve un error', async () => {
    fetch.mockRejectedValueOnce(new Error('dormido'));
    expect(siguioDeLargo(await pedir(`/producto/${FRESAS}`, UA.whatsapp))).toBe(true);
  });

  it('el sitemap lista las páginas fijas y solo los productos activos', async () => {
    const r = await pedir('/sitemap.xml', UA.persona);
    expect(r.headers.get('content-type')).toContain('application/xml');
    const xml = await r.text();
    expect(xml).toContain(`<loc>${ORIGEN}/</loc>`);
    expect(xml).toContain(`<loc>${ORIGEN}/producto/${FRESAS}</loc><lastmod>2026-10-04</lastmod>`);
    expect(xml).not.toContain('b'.repeat(24));
  });
});
