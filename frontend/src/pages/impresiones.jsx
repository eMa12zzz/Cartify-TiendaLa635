import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Store, User, FileUp, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { printServiceService } from '../api/printServiceService';
import { orderService } from '../api/orderService';
import { useAuth } from '../hooks/useAuth';
import { usePrintComposer } from '../hooks/usePrintComposer';
import PrintComposer from '../components/Store/PrintComposer';
import SubidorArchivo from '../components/UI/SubidorArchivo';
import { calcularPrecioImpresion } from '../utils/precioImpresion';

const BROWN = '#B46C30';
const BROWN_DARK = '#8A5222';

const Container = styled.div`min-height: 100vh; background: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;`;
const Header = styled.header`background: white; padding: 0 28px; border-bottom: 1px solid #ebebeb; display: flex; align-items: center; justify-content: space-between; gap: 20px; height: 64px; position: sticky; top: 0; z-index: 200;`;
const LogoArea = styled.div`display: flex; flex-direction: column; cursor: pointer; flex-shrink: 0;`;
const LogoTop = styled.span`font-size: 11px; color: #aaa; line-height: 1;`;
const LogoMain = styled.span`font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; line-height: 1.2;`;
const HeaderRight = styled.div`display: flex; align-items: center; gap: 8px;`;
const NavBtn = styled.button`background: white; color: #333; border: 1.5px solid #e0e0e0; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 30px; font-size: 13px; font-weight: 600; transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out); &:hover { border-color: ${BROWN}; color: ${BROWN}; }`;
const Content = styled.div`padding: 32px 28px 60px; max-width: 760px; margin: 0 auto;`;
const StepTitle = styled.h2`font-size: 18px; font-weight: 800; color: #111; margin: 0 0 14px;`;
const Tabs = styled.div`display: flex; gap: 8px; margin-bottom: 18px;`;
const Tab = styled.button`display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-radius: 12px; border: 1.5px solid ${p => (p.$active ? BROWN : '#e0e0e0')}; background: ${p => (p.$active ? '#F3E7D8' : 'white')}; color: ${p => (p.$active ? BROWN_DARK : '#555')}; font-size: 14px; font-weight: 700; cursor: pointer; transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out);`;
const SizesGrid = styled.div`display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; @media (max-width: 560px) { grid-template-columns: repeat(2, 1fr); }`;
const SizeCard = styled.button`min-height: 90px; border-radius: 10px; border: 1.5px solid ${p => (p.$active ? BROWN : '#cfcfcf')}; background: ${p => (p.$active ? '#F3E7D8' : 'white')}; color: ${p => (p.$active ? BROWN_DARK : '#222')}; font-size: 15px; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; transition: background-color var(--dur-press) var(--ease-out), border-color var(--dur-press) var(--ease-out), color var(--dur-press) var(--ease-out), transform var(--dur-press) var(--ease-out), box-shadow var(--dur-press) var(--ease-out); padding: 10px; &:hover { border-color: ${BROWN}; }`;
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
const ContinueBtn = styled.button`width: 100%; padding: 15px; background: ${BROWN}; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: background 0.2s; &:hover { background: ${BROWN_DARK}; } &:disabled { background: #d8c5af; cursor: not-allowed; }`;
const Bloque = styled.div`margin-bottom: 32px;`;

const Impresiones = () => {
  const navigate = useNavigate();
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

  const servicio = servicios.find((s) => s._id === servicioId);

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
      <Header>
        <LogoArea onClick={() => navigate('/tienda-dashboard')}>
          <LogoTop>Tienda</LogoTop>
          <LogoMain>la 635</LogoMain>
        </LogoArea>
        <HeaderRight>
          <NavBtn onClick={() => navigate('/store')}><Store size={16} /> Ir a la tienda</NavBtn>
          <NavBtn onClick={() => navigate('/mi-cuenta')}><User size={16} /> Mi Cuenta</NavBtn>
        </HeaderRight>
      </Header>

      <Content>
        <StepTitle>1. Elige el formato</StepTitle>
        {servicios.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14, marginBottom: 32 }}>No hay formatos disponibles. El admin los agrega en "Impresiones".</p>
        ) : (
          <SizesGrid>
            {servicios.map((s) => (
              <SizeCard key={s._id} $active={servicioId === s._id} onClick={() => { setServicioId(s._id); if (!s.allowsColor) setColor(false); }}>
                <span>{s.name}</span>
                <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>{s.widthCm} × {s.heightCm} cm</span>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>${Number(s.pricePerCopy).toFixed(2)}/copia</span>
              </SizeCard>
            ))}
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
            /*
             * Aquí la preview no es un lujo: el cliente PAGA por imprimir esto.
             * Ver el PDF completo antes de mandarlo es lo que evita el clásico
             * "imprimí el archivo equivocado" pagado y ya impreso.
             */
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
          ) : !servicio ? (
            <p style={{ color: '#999', fontSize: 14 }}>Primero elige un formato para armar tu hoja.</p>
          ) : (
            <PrintComposer composer={composer} />
          )}
        </Bloque>

        <StepTitle>3. Opciones</StepTitle>
        <OptionsCard>
          <Row>
            <Label>Color</Label>
            <Toggle $on={color} disabled={servicio && !servicio.allowsColor} onClick={() => servicio?.allowsColor && setColor((v) => !v)} aria-label="Color">
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
    </Container>
  );
};

export default Impresiones;
