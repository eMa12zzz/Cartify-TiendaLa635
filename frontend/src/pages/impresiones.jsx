import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileUp, LayoutGrid, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { printServiceService } from '../api/printServiceService';
import { orderService } from '../api/orderService';
import { useAuth } from '../hooks/useAuth';
import { usePrintComposer } from '../hooks/usePrintComposer';
import { useMaterialesImpresion } from '../hooks/useMaterialesImpresion';
import { useCalceImpresion } from '../hooks/useCalceImpresion';
import PrintComposer from '../components/Store/PrintComposer';
import HeaderTienda from '../components/Store/HeaderTienda';
import PieTienda from '../components/Store/PieTienda';
import SubidorArchivo from '../components/UI/SubidorArchivo';
import { calcularPrecioImpresion } from '../utils/precioImpresion';
import { pxDesdeCm } from '../utils/pxImpresion';

const BROWN = 'var(--marca-600)';
const BROWN_DARK = 'var(--marca-700)';

/* Columna flex por lo mismo que la tienda: con poco contenido, el pie tiene
   que aterrizar abajo y no quedar flotando a media pantalla. */
const Container = styled.div`min-height: 100vh; background: #f6f6f6; font-family: var(--fuente); display: flex; flex-direction: column;`;
const Content = styled.div`flex: 1; padding: 32px 28px 60px; max-width: 760px; margin: 0 auto; width: 100%;`;
const StepTitle = styled.h2`font-size: 18px; font-weight: 800; color: #111; margin: 0 0 14px;`;
const Tabs = styled.div`display: flex; gap: 8px; margin-bottom: 18px;`;
const Tab = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 12px; border: 1.5px solid ${p => (p.$active ? BROWN : '#e0e0e0')}; background: ${p => (p.$active ? 'var(--marca-100)' : 'white')}; color: ${p => (p.$active ? BROWN_DARK : '#555')}; font-size: 14px; font-weight: 700; cursor: pointer; transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);`;
const SizesGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; @media (max-width: 560px) { grid-template-columns: repeat(2, 1fr); }`;
const SizeCard = styled.button`min-height: 90px; border-radius: 10px; border: 1.5px solid ${p => (p.$active ? BROWN : '#cfcfcf')}; background: ${p => (p.$active ? 'var(--marca-100)' : 'white')}; color: ${p => (p.$active ? BROWN_DARK : '#222')}; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out); padding: 10px; &:hover { border-color: ${BROWN}; }
  /*
   * Sin material no se puede elegir. Se deja VISIBLE y apagado en vez de
   * esconderlo: la tienda sí ofrece ese formato, hoy no hay con qué hacerlo.
   * Un formato que desaparece de la lista parece que nunca existió, y la gente
   * lo vuelve a buscar mañana sin entender qué pasó.
   */
  &:disabled { opacity: 0.5; cursor: not-allowed; background: #f7f7f7; border-color: #e0e0e0; color: #888; }
  &:disabled:hover { border-color: #e0e0e0; }
`;

// El motivo, en palabras. "Agotado" a secas no dice qué se acabó.
const SinMaterial = styled.span`font-size: 11px; font-weight: 700; color: #C0392B; text-transform: uppercase; letter-spacing: 0.3px;`;
const QuedaPoco = styled.span`font-size: 11px; font-weight: 700; color: ${BROWN_DARK};`;
const OptionsCard = styled.div`background: white; border: 1px solid #ebebeb; border-radius: 14px; padding: 20px; margin-bottom: 28px; display: flex; flex-direction: column; gap: 16px;`;
const Row = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px;`;
const Label = styled.span`font-size: 14px; color: #333; font-weight: 600;`;
const NumInput = styled.input`width: 90px; border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 8px 10px; font-size: 14px; outline: none; &:focus { border-color: ${BROWN}; }`;
const Select = styled.select`border: 1.5px solid #e0e0e0; border-radius: 8px; padding: 8px 10px; font-size: 14px; outline: none; background: white; &:focus { border-color: ${BROWN}; }`;
const Toggle = styled.button`position: relative; width: 44px; height: 24px; border-radius: 999px; border: none; cursor: pointer; background: ${p => (p.$on ? BROWN : '#d1d5db')}; transition: background-color var(--dur-press) var(--ease-out); & span { position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%; background: white; transform: ${p => (p.$on ? 'translateX(20px)' : 'translateX(0)')}; transition: transform var(--dur-press) var(--ease-out); }`;
const PriceBox = styled.div`display: flex; align-items: baseline; justify-content: space-between; padding: 16px 0; border-top: 1px dashed #ddd; margin-bottom: 20px;`;
const PriceLabel = styled.span`font-size: 15px; color: #555;`;
const PriceValue = styled.span`font-size: 28px; font-weight: 800; color: ${BROWN_DARK};`;
const ErrorMsg = styled.div`color: #ef4444; font-size: 13px; margin-bottom: 16px;`;
/*
 * Distinto del ErrorMsg rojo a propósito: esto no bloquea nada, es un
 * "ojo con esto" — mismo tono ámbar que usan los avisos de advertencia en
 * el resto de la web, no la alarma roja de "esto no se puede enviar".
 */
const Advertencia = styled.div`display: flex; align-items: flex-start; gap: 8px; background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; border-radius: 10px; padding: 10px 14px; font-size: 13px; line-height: 1.4; margin-top: 10px;`;
const ContinueBtn = styled.button`width: 100%; padding: 15px; background: ${BROWN}; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; &:hover { background: ${BROWN_DARK}; } &:disabled { background: #C9D4DB; cursor: not-allowed; }`;
const Bloque = styled.div`margin-bottom: 32px;`;

const Impresiones = () => {
  const { user } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState(null);
  const [modo, setModo] = useState('archivo'); // 'archivo' | 'editor'
  const [archivo, setArchivo] = useState(null);
  /*
   * La pantalla no se desmonta al enviar, así que para que el subidor vuelva a
   * quedar vacío hay que avisarle: cada envío exitoso sube este número.
   */
  const [enviosHechos, setEnviosHechos] = useState(0);
  const [color, setColor] = useState(false);
  const [copias, setCopias] = useState(1);
  const [dobleCara, setDobleCara] = useState(false);
  const [papel, setPapel] = useState('Normal');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    printServiceService.getServices()
      .then((d) => setServicios((Array.isArray(d) ? d : []).filter((s) => s.isActive !== false)))
      .catch(() => {});
  }, []);

  /*
   * Qué se puede imprimir HOY. La disponibilidad no la decide esta pantalla:
   * la calcula el hook a partir del papel y la tinta que quedan en el panel.
   */
  const { disponibilidadDeFormato, hayTintaDeColor } = useMaterialesImpresion();

  const servicio = servicios.find((s) => s._id === servicioId);

  // El color se apaga solo si se acabó el tóner, aunque el formato lo permita.
  const puedeColor = !!servicio?.allowsColor && hayTintaDeColor;

  /*
   * Si el material se acaba con el formato ya elegido —pasa: el empleado
   * imprime lo último mientras alguien arma su pedido—, se suelta la selección
   * en vez de dejarlo pagar algo que ya no se puede hacer.
   */
  useEffect(() => {
    if (servicio && !disponibilidadDeFormato(servicio).disponible) setServicioId(null);
  }, [servicio, disponibilidadDeFormato]);

  useEffect(() => {
    if (!puedeColor && color) setColor(false);
  }, [puedeColor, color]);

  // El editor usa las medidas reales de la plantilla elegida.
  const composer = usePrintComposer({
    widthCm: servicio?.widthCm || 21.6,
    heightCm: servicio?.heightCm || 27.9,
  });

  const paginas = modo === 'editor' ? composer.paginas.length : 1;
  // Misma fórmula que usa el backend para cobrar: por hoja, y doble cara
  // reduce las hojas a la mitad.
  const { total, hojas, precioPorHoja } = calcularPrecioImpresion({
    servicio,
    paginas,
    copias,
    color,
    dobleCara: dobleCara,
  });

  // El subidor se encarga de la preview y las validaciones; aquí solo guardamos
  // el archivo, que es lo que va a viajar en el FormData.
  const seleccionarArchivo = (file) => { setArchivo(file); setError(''); };

  /*
   * En modo "archivo" nadie ajusta la imagen a la medida elegida — se manda
   * tal cual a la impresora (ver el comentario largo en calceImpresion.js).
   * Esto solo avisa cuando la proporción o la resolución no calzan; en modo
   * editor el lienzo YA fuerza la medida real, así que no hace falta.
   */
  const advertenciaCalce = useCalceImpresion(modo === 'archivo' ? archivo : null, servicio);

  const enviar = async () => {
    if (!servicioId) { setError('Selecciona un formato de impresión.'); return; }
    if (!user?.id) { setError('Inicia sesión como cliente para enviar tu impresión.'); return; }
    if (modo === 'archivo' && !archivo) { setError('Sube un archivo antes de continuar.'); return; }
    if (modo === 'editor' && composer.totalItems === 0) { setError('Agrega al menos una imagen a tu hoja.'); return; }
    setError('');

    setEnviando(true);
    try {
      // En modo editor, generamos el archivo: 1 hoja → imagen, varias → PDF.
      const file = modo === 'editor' ? await composer.exportar() : archivo;

      const fd = new FormData();
      fd.append('file', file);
      fd.append('clientId', user.id);
      fd.append('serviceId', servicioId);
      fd.append('color', color);
      fd.append('copies', copias);
      fd.append('pages', paginas);
      fd.append('doubleSided', dobleCara);
      fd.append('paper', papel);

      const r = await orderService.createPrintOrder(fd);
      toast.success(r?.emailedToPrinter ? '¡Enviado a la impresora!' : '¡Pedido de impresión creado! Un empleado lo preparará.');
      setArchivo(null); setEnviosHechos((n) => n + 1);
      setCopias(1); setColor(false); setDobleCara(false); setPapel('Normal');
    } catch (e) {
      console.error(e); // el interceptor de Axios ya muestra el error
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Container>
      {/*
        El MISMO encabezado de la tienda. Antes esta pantalla tenía una barra
        propia de dos botones —"Ir a la tienda" y "Mi Cuenta"— que la hacía
        sentir otro sitio: sin pasillos, sin dirección de entrega, sin buscador
        y sin carrito. Impresiones no es otra tienda, es otro pasillo de la
        misma; ahora se ve así. Ver HeaderTienda.
      */}
      <HeaderTienda />

      <Content>
        <StepTitle>1. Elige el formato</StepTitle>
        {servicios.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14, marginBottom: 32 }}>No hay formatos disponibles. El admin los agrega en "Impresiones".</p>
        ) : (
          <SizesGrid>
            {servicios.map((s) => {
              const { disponible, motivo, poco } = disponibilidadDeFormato(s);
              return (
              <SizeCard
                key={s._id}
                $active={servicioId === s._id}
                disabled={!disponible}
                title={disponible ? undefined : motivo}
                onClick={() => { setServicioId(s._id); if (!s.allowsColor) setColor(false); }}
              >
                <span>{s.name}</span>
                <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{pxDesdeCm(s.widthCm)} × {pxDesdeCm(s.heightCm)} px</span>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>${Number(s.pricePerCopy).toFixed(2)}/copia</span>
                {/* El motivo va DENTRO de la tarjeta, no en un aviso aparte:
                    se lee justo donde la persona está mirando y decidiendo. */}
                {!disponible && <SinMaterial>{motivo}</SinMaterial>}
                {disponible && poco && <QuedaPoco>Quedan pocas</QuedaPoco>}
              </SizeCard>
              );
            })}
          </SizesGrid>
        )}

        <StepTitle>2. ¿Cómo quieres imprimir?</StepTitle>
        <Tabs>
          <Tab type="button" $active={modo === 'archivo'} onClick={() => setModo('archivo')}>
            <FileUp size={18} /> Ya tengo mi archivo
          </Tab>
          <Tab type="button" $active={modo === 'editor'} onClick={() => setModo('editor')}>
            <LayoutGrid size={18} /> Armar mi impresión
          </Tab>
        </Tabs>

        <Bloque>
          {modo === 'archivo' ? (
            <>
              {/*
                Aquí la preview no es un lujo: el cliente PAGA por imprimir esto.
                Ver el PDF completo antes de mandarlo es lo que evita el clásico
                "imprimí el archivo equivocado" pagado y ya impreso.
              */}
              <SubidorArchivo
                accept=".pdf,.jpg,.jpeg,.png"
                maxMB={10}
                onArchivo={seleccionarArchivo}
                reinicio={enviosHechos}
                alto={150}
                altoPreview={340}
                ajuste="contain"
                titulo="Arrastra tu archivo o haz clic para elegirlo"
                ayuda="PDF, JPG o PNG"
                etiquetaAria="Subir el archivo a imprimir"
              />
              {advertenciaCalce && (
                <Advertencia role="status">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{advertenciaCalce}</span>
                </Advertencia>
              )}
            </>
          ) : !servicio ? (
            <p style={{ color: '#999', fontSize: 14 }}>Primero elige un formato para armar tu hoja.</p>
          ) : (
            <PrintComposer composer={composer} />
          )}
        </Bloque>

        <StepTitle>3. Opciones</StepTitle>
        <OptionsCard>
          <Row>
            <Label>
              Color
              {/*
                Dos razones distintas para no poder elegir color, y la persona
                merece saber cuál le tocó: el formato no lo admite (nunca va a
                poder), o se acabó el tóner (mañana quizás sí).
              */}
              {servicio && !servicio.allowsColor && (
                <span style={{ display: 'block', fontSize: 11, color: '#999', fontWeight: 400 }}>
                  Este formato es solo en blanco y negro
                </span>
              )}
              {servicio?.allowsColor && !hayTintaDeColor && (
                <span style={{ display: 'block', fontSize: 11, color: '#C0392B', fontWeight: 600 }}>
                  Hoy no hay tinta de color
                </span>
              )}
            </Label>
            <Toggle $on={color} disabled={!puedeColor} onClick={() => puedeColor && setColor((v) => !v)} aria-label="Color">
              <span />
            </Toggle>
          </Row>
          <Row>
            <Label>Copias</Label>
            <NumInput type="number" min="1" value={copias} onChange={(e) => setCopias(e.target.value)} />
          </Row>
          <Row>
            <Label>Doble cara</Label>
            <Toggle $on={dobleCara} onClick={() => setDobleCara((v) => !v)} aria-label="Doble cara"><span /></Toggle>
          </Row>
          <Row>
            <Label>Tipo de papel</Label>
            <Select value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option>Normal</option>
              <option>Fotográfico</option>
              <option>Cartulina</option>
              <option>Reciclado</option>
            </Select>
          </Row>
        </OptionsCard>

        <PriceBox>
          {/* Desglose explícito: así el cliente ve por qué doble cara le sale
              más barato y cuánto le suma el color. */}
          <PriceLabel>
            Total
            {servicio && (
              <span style={{ display: 'block', fontSize: 11, opacity: 0.75, fontWeight: 400, marginTop: 2 }}>
                {copias} × {hojas} hoja{hojas > 1 ? 's' : ''} × ${precioPorHoja.toFixed(2)}
                {dobleCara && paginas > 1 ? ` · ${paginas} págs a doble cara` : ''}
                {color && servicio.allowsColor ? ` · color +$${Number(servicio.colorSurcharge || 0).toFixed(2)}/hoja` : ''}
              </span>
            )}
          </PriceLabel>
          <PriceValue>${total.toFixed(2)}</PriceValue>
        </PriceBox>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <ContinueBtn onClick={enviar} disabled={enviando}>
          {enviando ? 'Preparando…' : 'Enviar a imprimir'}
        </ContinueBtn>
      </Content>

      {/* El mismo pie que la tienda: acá también se acaba la página, y sin él
          quedaba cortada. */}
      <PieTienda />
    </Container>
  );
};

export default Impresiones;
