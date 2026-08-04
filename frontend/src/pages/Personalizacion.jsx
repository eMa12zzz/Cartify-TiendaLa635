import { useState, useEffect } from 'react';
import { Palette, ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Lock } from 'lucide-react';
import { useAjustesCtx } from '../context/AjustesContext';
import SubidorArchivo from '../components/UI/SubidorArchivo';

/*
 * ============================================================
 * PERSONALIZACIÓN (Admin) — Personalizacion.jsx
 * ============================================================
 * Cómo se ve la tienda de cara al cliente: su nombre, su logo y el orden de
 * su portada.
 *
 * Por qué existe: el nombre estaba escrito a mano en el código, en tres
 * archivos distintos. Una tienda que no puede ponerse su propio nombre sin
 * llamar a un programador no es un producto, es un encargo.
 *
 * LA REGLA DE LA PORTADA: se elige CUÁLES filas se muestran y EN QUÉ ORDEN,
 * pero no qué producto va en cada una — eso lo sigue armando el sistema con
 * el inventario. Ver utils/portada.js para el porqué.
 *
 * Toda la lógica vive en useAjustesTienda; aquí solo está la pantalla.
 *
 * Se lee del CONTEXTO y no del hook directo: es la misma copia que usa la
 * tienda, así que al guardar el nombre nuevo aparece de una vez en el
 * encabezado y en el pie. Con una copia aparte, el panel guardaba y la tienda
 * seguía mostrando lo viejo hasta recargar la página entera.
 * ============================================================
 */
const Personalizacion = () => {
  const {
    ajustes, portada, cargando, guardando,
    guardar, mover, alternarVisible, subirLogo, quitarLogo,
  } = useAjustesCtx();

  const [form, setForm] = useState({
    nombreLinea1: '', nombreLinea2: '', lema: '', direccion: '',
  });

  useEffect(() => {
    setForm({
      nombreLinea1: ajustes.nombreLinea1 || '',
      nombreLinea2: ajustes.nombreLinea2 || '',
      lema: ajustes.lema || '',
      direccion: ajustes.direccion || '',
    });
  }, [ajustes.nombreLinea1, ajustes.nombreLinea2, ajustes.lema, ajustes.direccion]);

  const onSubmit = (e) => {
    e.preventDefault();
    guardar(form);
  };

  const inputStyle = {
    backgroundColor: 'var(--theme-card-bg)',
    borderColor: 'var(--theme-card-border)',
    color: 'var(--theme-text-primary)',
  };

  const tarjeta = {
    backgroundColor: 'var(--theme-card-bg)',
    borderColor: 'var(--theme-card-border)',
  };

  // Cuántas quedan encendidas: con una sola, su interruptor se bloquea para
  // que nadie deje la portada en blanco sin querer.
  const encendidas = portada.filter((b) => b.visible).length;

  return (
    <div className="flex flex-col gap-6 w-full pb-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Palette className="w-8 h-8" style={{ color: 'var(--theme-accent)' }} />
        <h1 className="text-4xl font-extrabold" style={{ color: 'var(--theme-accent)' }}>
          Personalización
        </h1>
      </div>

      {cargando ? (
        <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
          Cargando los ajustes de la tienda…
        </p>
      ) : (
        <>
          {/* ── Identidad ── */}
          <form
            onSubmit={onSubmit}
            className="p-6 rounded-2xl shadow-sm border space-y-6"
            style={tarjeta}
          >
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Identidad
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                El nombre y el logo salen en el encabezado de la tienda y en el pie de página.
              </p>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Logo
              </label>

              <SubidorArchivo
                accept="image/*"
                maxMB={8}
                valorInicial={ajustes.logoUrl || null}
                onArchivo={(archivo) => { if (archivo) subirLogo(archivo); }}
                alto={140}
                titulo="Arrastre el logo o haga clic para elegirlo"
                ayuda="PNG con fondo transparente se ve mejor. Se muestra a 38 px de alto."
                etiquetaAria="Subir el logo de la tienda"
              />

              {/*
                Quitar el logo es distinto de subir otro: se vuelve al nombre
                escrito, que es un resultado legítimo y no un paso intermedio.
              */}
              {ajustes.logoUrl && (
                <button
                  type="button"
                  onClick={quitarLogo}
                  disabled={guardando}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-60"
                  style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Quitar el logo y usar el nombre escrito
                </button>
              )}
            </div>

            {/* Nombre en dos líneas */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Nombre de la tienda
              </label>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Va en dos líneas apiladas, con el mismo peso. Deje la segunda vacía si su
                nombre es de una sola línea.
              </p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text" maxLength={24}
                  value={form.nombreLinea1}
                  onChange={(e) => setForm({ ...form, nombreLinea1: e.target.value })}
                  placeholder="Tienda"
                  className="w-44 px-4 py-2.5 rounded-xl border outline-none"
                  style={inputStyle}
                />
                <input
                  type="text" maxLength={24}
                  value={form.nombreLinea2}
                  onChange={(e) => setForm({ ...form, nombreLinea2: e.target.value })}
                  placeholder="la 635"
                  className="w-44 px-4 py-2.5 rounded-xl border outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Cómo va a verse, con la misma pinta que en el encabezado. */}
              <div
                className="mt-3 inline-flex flex-col leading-none rounded-xl px-4 py-3"
                style={{ backgroundColor: 'var(--theme-primary-light)' }}
              >
                <span className="text-[19px] font-extrabold tracking-tight"
                      style={{ color: 'var(--theme-text-primary)' }}>
                  {form.nombreLinea1 || 'Tienda'}
                </span>
                {form.nombreLinea2 && (
                  <span className="text-[19px] font-extrabold tracking-tight"
                        style={{ color: 'var(--theme-text-primary)' }}>
                    {form.nombreLinea2}
                  </span>
                )}
              </div>
            </div>

            {/* Lema */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Frase del pie de página
              </label>
              <textarea
                rows={2} maxLength={160}
                value={form.lema}
                onChange={(e) => setForm({ ...form, lema: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border outline-none resize-none"
                style={inputStyle}
              />
              <div className="text-xs text-right" style={{ color: 'var(--theme-text-muted)' }}>
                {form.lema.length}/160
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Dirección de la tienda
              </label>
              <p className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                Sale en el pie y es de donde salen los repartos.
              </p>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border outline-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit" disabled={guardando}
              className="px-8 py-2.5 rounded-full font-bold shadow-sm transition-colors disabled:opacity-60"
              style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-button-text)' }}
            >
              {guardando ? 'Guardando…' : 'Guardar identidad'}
            </button>
          </form>

          {/* ── Portada ── */}
          <div className="p-6 rounded-2xl shadow-sm border" style={tarjeta}>
            <div className="mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                Portada de la tienda
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                Elija qué filas se muestran y en qué orden. Lo que va DENTRO de cada fila lo
                arma el sistema con su inventario, así que no se queda desactualizado.
                Se guarda solo al mover o apagar.
              </p>
            </div>

            <ul className="space-y-2">
              {portada.map((bloque, i) => {
                // La última encendida no se puede apagar: la portada no puede
                // quedar en blanco.
                const esLaUltima = bloque.visible && encendidas === 1;

                return (
                  <li
                    key={bloque.clave}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-opacity"
                    style={{
                      borderColor: 'var(--theme-card-border)',
                      backgroundColor: bloque.visible ? 'transparent' : 'var(--theme-primary-light)',
                      opacity: bloque.visible ? 1 : 0.65,
                    }}
                  >
                    {/* Orden */}
                    <span
                      className="w-7 h-7 flex-none rounded-full grid place-items-center text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--theme-primary-light)',
                        color: 'var(--theme-primary)',
                      }}
                    >
                      {i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                        {bloque.nombre}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                        {bloque.descripcion}
                      </div>
                    </div>

                    {/* Subir / bajar */}
                    <div className="flex flex-none gap-1">
                      <button
                        type="button"
                        onClick={() => mover(bloque.clave, 'arriba')}
                        disabled={i === 0 || guardando}
                        aria-label={`Subir ${bloque.nombre}`}
                        className="w-8 h-8 grid place-items-center rounded-lg border transition-colors disabled:opacity-30"
                        style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(bloque.clave, 'abajo')}
                        disabled={i === portada.length - 1 || guardando}
                        aria-label={`Bajar ${bloque.nombre}`}
                        className="w-8 h-8 grid place-items-center rounded-lg border transition-colors disabled:opacity-30"
                        style={{ borderColor: 'var(--theme-card-border)', color: 'var(--theme-text-secondary)' }}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Encender / apagar */}
                    <button
                      type="button"
                      onClick={() => alternarVisible(bloque.clave)}
                      disabled={esLaUltima || guardando}
                      title={esLaUltima ? 'La portada no puede quedar vacía' : undefined}
                      aria-label={`${bloque.visible ? 'Ocultar' : 'Mostrar'} ${bloque.nombre}`}
                      className="w-8 h-8 flex-none grid place-items-center rounded-lg border transition-colors disabled:opacity-40"
                      style={{
                        borderColor: bloque.visible ? 'var(--theme-primary)' : 'var(--theme-card-border)',
                        color: bloque.visible ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                      }}
                    >
                      {esLaUltima
                        ? <Lock className="w-4 h-4" />
                        : bloque.visible
                          ? <Eye className="w-4 h-4" />
                          : <EyeOff className="w-4 h-4" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="text-xs mt-4" style={{ color: 'var(--theme-text-muted)' }}>
              El catálogo completo ("Todos los productos") siempre va al final y no se puede
              quitar: es la tienda en sí, no una fila de adorno.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Personalizacion;
