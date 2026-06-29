import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Upload, FileCheck2 } from 'lucide-react';

const BROWN = '#8B5A2B';
const BROWN_DARK = '#5a3a1a';

/* ─── Layout ─── */
const Container = styled.div`
  min-height: 100vh;
  background: #f6f6f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

/* ─── Header (igual al de la tienda) ─── */
const Header = styled.header`
  background: white;
  padding: 0 28px;
  border-bottom: 1px solid #ebebeb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 200;
`;

const LogoArea = styled.div`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  flex-shrink: 0;
`;

const LogoTop = styled.span`
  font-size: 11px;
  color: #aaa;
  line-height: 1;
`;

const LogoMain = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1.2;
`;

const LocationPill = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #444;
  background: #f5f5f5;
  padding: 7px 14px;
  border-radius: 30px;
  flex-shrink: 0;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #ececec; }
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 420px;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40px;
  padding: 0 16px;
  gap: 8px;
  height: 42px;
  transition: box-shadow 0.2s;

  &:focus-within {
    box-shadow: 0 0 0 2px ${BROWN}40;
    background: white;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #111;
    &::placeholder { color: #bbb; }
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PillBtn = styled.button`
  background: ${BROWN};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.2s;
  &:hover { background: ${BROWN_DARK}; }
`;

const LoginBtn = styled.button`
  background: white;
  color: #333;
  border: 1.5px solid #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  &:hover { border-color: ${BROWN}; color: ${BROWN}; }
`;

/* ─── Contenido ─── */
const Content = styled.div`
  padding: 40px 28px 60px;
  max-width: 760px;
  margin: 0 auto;
`;

const StepTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #111;
  margin: 0 0 14px;
`;

/* ─── Paso 1: subir archivo ─── */
const Dropzone = styled.div`
  border: 2px dashed ${props => (props.$active ? BROWN : '#d8d8d8')};
  background: ${props => (props.$active ? '#f5ede4' : '#ececec')};
  border-radius: 14px;
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 36px;

  &:hover {
    border-color: ${BROWN};
    background: #f5ede4;
  }
`;

const DropHint = styled.p`
  font-size: 13px;
  color: #999;
  margin: 0;
`;

const FileChip = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: ${BROWN_DARK};
  font-weight: 600;
`;

const HiddenInput = styled.input`
  display: none;
`;

/* ─── Paso 2: medidas ─── */
const SizesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const SizeCard = styled.button`
  height: 140px;
  border-radius: 10px;
  border: 1.5px dashed ${props => (props.$active ? BROWN : '#cfcfcf')};
  background: ${props => (props.$active ? '#f5ede4' : 'white')};
  color: ${props => (props.$active ? BROWN_DARK : '#222')};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    border-color: ${BROWN};
    background: #f9f3ec;
  }
`;

const ErrorMsg = styled.div`
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 16px;
`;

const ContinueBtn = styled.button`
  width: 100%;
  padding: 15px;
  background: ${BROWN};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: ${BROWN_DARK}; }
  &:disabled {
    background: #d8c5af;
    cursor: not-allowed;
  }
`;

const medidas = [
  { id: 'dui', label: 'DUI' },
  { id: 'poster1', label: 'Poster' },
  { id: 'poster2', label: 'Poster' },
  { id: 'carta', label: 'Carta' },
  { id: 'a4-1', label: 'A4' },
  { id: 'a4-2', label: 'A4' },
];

const Impresiones = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState(null);
  const [error, setError] = useState('');

  const handleSeleccionarArchivo = (e) => {
    const file = e.target.files?.[0];
    if (file) setArchivo(file);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setArchivo(file);
    setError('');
  };

  const handleContinuar = () => {
    if (!archivo) {
      setError('Por favor sube un archivo antes de continuar.');
      return;
    }
    if (!medidaSeleccionada) {
      setError('Selecciona una medida para tu impresión.');
      return;
    }
    setError('');
    navigate('/impresiones/resumen', {
      state: { archivoNombre: archivo.name, medida: medidaSeleccionada },
    });
  };

  return (
    <Container>
      <Header>
        <LogoArea onClick={() => navigate('/tienda-dashboard')}>
          <LogoTop>Tienda</LogoTop>
          <LogoMain>la 635</LogoMain>
        </LogoArea>

        <LocationPill>📍 10115 New York</LocationPill>

        <SearchBox>
          <span style={{ fontSize: 16 }}>🔍</span>
          <input type="text" placeholder="Orange" />
        </SearchBox>

        <HeaderRight>
          <PillBtn>🎙️ Asistente</PillBtn>
          <PillBtn>🛒 Carrito</PillBtn>
          <LoginBtn>👤 Login</LoginBtn>
        </HeaderRight>
      </Header>

      <Content>
        <StepTitle>1. Sube tu archivo</StepTitle>

        <Dropzone
          $active={arrastrando}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={handleDrop}
        >
          {archivo ? (
            <FileChip>
              <FileCheck2 size={20} />
              {archivo.name}
            </FileChip>
          ) : (
            <>
              <Upload size={26} color="#555" />
              <DropHint>Subir archivo: pdf, jpg, png...</DropHint>
            </>
          )}
          <HiddenInput
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleSeleccionarArchivo}
          />
        </Dropzone>

        <StepTitle>2. Selecciona las medidas</StepTitle>

        <SizesGrid>
          {medidas.map((m) => (
            <SizeCard
              key={m.id}
              $active={medidaSeleccionada === m.id}
              onClick={() => setMedidaSeleccionada(m.id)}
            >
              {m.label}
            </SizeCard>
          ))}
        </SizesGrid>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <ContinueBtn onClick={handleContinuar}>
          Continuar
        </ContinueBtn>
      </Content>
    </Container>
  );
};

export default Impresiones;