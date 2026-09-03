/*
 * ============================================================
 * TAB MENU — los cuatro apartados, ahora con react-navigation
 * ============================================================
 * La barra sigue siendo `BarraInferior` tal cual estaba: se le pasa como
 * `tabBar` propio en vez de dejar que bottom-tabs dibuje la suya, porque esa
 * barra ya trae el diseño, los iconos de lucide y el hueco de la franja de
 * gestos resueltos.
 *
 * La única lógica nueva de este archivo es la que antes vivía en `Raiz`
 * (App.js): los dos apartados que piden sesión no se abren a medias, y si se
 * cierra la sesión estando en uno de esos dos, se cae a la tienda.
 */

import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { destinoPendiente, navegarA } from './navigationRef';
import BarraInferior from '../components/UI/BarraInferior';
import Inicio from '../pages/Inicio';
import Asistente from '../pages/Asistente';
import Pedidos from '../pages/Pedidos';
import Perfil from '../pages/Perfil';

const Tab = createBottomTabNavigator();

const CON_SESION = ['pedidos', 'perfil'];

const BarraDeApartados = ({ state, navigation }) => {
  const { isAuthenticated } = useAuth();
  const apartado = state.routes[state.index].name;

  useEffect(() => {
    if (!isAuthenticated && CON_SESION.includes(apartado)) {
      navigation.navigate('inicio');
    }
  }, [isAuthenticated, apartado, navigation]);

  const cambiar = (clave) => {
    if (CON_SESION.includes(clave) && !isAuthenticated) {
      destinoPendiente.current = clave;
      navegarA('Login');
      return;
    }
    navigation.navigate(clave);
  };

  return <BarraInferior apartado={apartado} alCambiar={cambiar} />;
};

// Inicio necesita mandar al carrito y a una sección, dos pantallas que viven
// en el Stack de más arriba y no entre los apartados.
const InicioTab = ({ navigation }) => (
  <Inicio
    irACarrito={() => navigation.navigate('Carrito')}
    irASeccion={(seccion) => navigation.navigate('Seccion', { seccion })}
  />
);

const TabMenu = () => (
  <Tab.Navigator
    tabBar={(props) => <BarraDeApartados {...props} />}
    // `animation` es de bottom-tabs 7, no algo casero: solo se prende. Un
    // cruce de opacidad entre pantallas, no un slide — no hay un "orden"
    // real entre Tienda/Asistente/Pedidos/Perfil que un slide izq-der tenga
    // que respetar.
    screenOptions={{ headerShown: false, animation: 'fade' }}
  >
    <Tab.Screen name="inicio" component={InicioTab} />
    <Tab.Screen name="asistente" component={Asistente} />
    <Tab.Screen name="pedidos" component={Pedidos} />
    <Tab.Screen name="perfil" component={Perfil} />
  </Tab.Navigator>
);

export default TabMenu;
