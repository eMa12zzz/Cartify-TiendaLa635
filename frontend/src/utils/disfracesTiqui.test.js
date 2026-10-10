import { describe, it, expect } from 'vitest';
import {
  describirDisfraz,
  disfrazDeTema,
  mismoDisfraz,
  normalizarDisfraz,
  sinSombrero,
} from './disfracesTiqui';
import { PIEZAS_DISFRAZ, RANURAS_DISFRAZ } from './piezasDisfraz';
import { TEMAS_DE_TEMPORADA, temaDesdePropio } from './temporadas';
import { PIEZAS_POR_RANURA } from '../../../backend/src/utils/disfracesTiqui.js';

const tema = (clave) => TEMAS_DE_TEMPORADA.find((t) => t.clave === clave);

describe('el disfraz de cada temporada', () => {
  it('las de fábrica traen el suyo', () => {
    expect(disfrazDeTema(tema('navidad')).cabeza.tipo).toBe('gorro-navidad');
    expect(disfrazDeTema(tema('independencia')).cuello).toEqual({ tipo: 'corbatin', principal: '#0F47AF', acento: '#FFFFFF' });
    expect(disfrazDeTema(tema('san-valentin')).rubor).toBe(true);
    expect(disfrazDeTema(null)).toBeNull();
  });

  it('el que armó el dueño gana al de fábrica', () => {
    const disfraces = {
      navidad: { cabeza: null, cara: { tipo: 'lentes', principal: '#1F2937', acento: '#1F2937' }, cuello: null, rubor: false },
    };
    const puesto = disfrazDeTema(tema('navidad'), disfraces);
    expect(puesto.cabeza).toBeNull();
    expect(puesto.cara.tipo).toBe('lentes');
  });

  it('armado sin piezas quiere decir sin disfraz', () => {
    expect(disfrazDeTema(tema('halloween'), { halloween: { cabeza: null, cara: null, cuello: null, rubor: false } })).toBeNull();
  });

  it('las propias lo sacan de su figura, y si los colores son iguales las rayas van en blanco', () => {
    const propia = temaDesdePropio({
      clave: 'propia-invierno', nombre: 'Invierno', desde: { mes: 1, dia: 1 }, hasta: { mes: 1, dia: 31 },
      colorPrincipal: '#112233', colorAcento: '#112233', figura: 'copo', saludo: '',
    });
    expect(disfrazDeTema(propia).cuello).toEqual({ tipo: 'bufanda', principal: '#112233', acento: '#FFFFFF' });
  });

  it('entiende la forma de antes, de una sola pieza', () => {
    expect(normalizarDisfraz({ tipo: 'mono', principal: '#E11D74', acento: '#9D174D', rubor: true })).toEqual({
      cabeza: { tipo: 'mono', principal: '#E11D74', acento: '#9D174D' }, cara: null, cuello: null, rubor: true,
    });
  });

  it('descarta piezas que no existen o en el lugar equivocado', () => {
    const limpio = normalizarDisfraz({ cabeza: { tipo: 'corbatin' }, cara: { tipo: 'capa' } });
    expect(limpio.cabeza).toBeNull();
    expect(limpio.cara).toBeNull();
  });
});

describe('sin sombrero (la Tiqui colgada del login)', () => {
  it('lo de la cabeza pasa al cuello', () => {
    const d = sinSombrero(disfrazDeTema(tema('navidad')));
    expect(d.cabeza).toBeNull();
    expect(d.cuello.tipo).toBe('bufanda');
  });

  it('si el cuello ya tiene algo, se respeta', () => {
    const d = sinSombrero({
      cabeza: { tipo: 'corona', principal: '#FFC23D', acento: '#E11D48' },
      cara: null,
      cuello: { tipo: 'medalla', principal: '#0F47AF', acento: '#FFC23D' },
      rubor: false,
    });
    expect(d.cabeza).toBeNull();
    expect(d.cuello.tipo).toBe('medalla');
  });
});

describe('lo que dice el panel', () => {
  it('cuenta las piezas en una frase', () => {
    expect(describirDisfraz({
      cabeza: { tipo: 'corona' }, cara: { tipo: 'lentes-sol' }, cuello: { tipo: 'corbatin' }, rubor: false,
    })).toBe('corona, lentes de sol y corbatín');
    expect(describirDisfraz(disfrazDeTema(tema('san-valentin')))).toBe('moño y cachetes colorados');
  });

  it('sabe si dos disfraces son el mismo', () => {
    const a = disfrazDeTema(tema('navidad'));
    expect(mismoDisfraz(a, { cabeza: { ...a.cabeza } })).toBe(true);
    expect(mismoDisfraz(a, { cabeza: { ...a.cabeza, principal: '#000000' } })).toBe(false);
  });
});

describe('el catálogo de piezas', () => {
  it('cada pieza va en un lugar que existe, con sus colores y formas que se saben dibujar', () => {
    const lugares = RANURAS_DISFRAZ.map((r) => r.clave);
    for (const [tipo, pieza] of Object.entries(PIEZAS_DISFRAZ)) {
      expect(lugares, tipo).toContain(pieza.ranura);
      expect(pieza.colores.length, tipo).toBe(pieza.nombresColores.length);
      for (const forma of pieza.formas) expect(['path', 'rect', 'circle', 'ellipse'], tipo).toContain(forma.el);
    }
  });

  it('el servidor acepta exactamente las mismas piezas', () => {
    for (const { clave } of RANURAS_DISFRAZ) {
      const aca = Object.keys(PIEZAS_DISFRAZ).filter((t) => PIEZAS_DISFRAZ[t].ranura === clave).sort();
      expect([...PIEZAS_POR_RANURA[clave]].sort(), clave).toEqual(aca);
    }
  });
});
