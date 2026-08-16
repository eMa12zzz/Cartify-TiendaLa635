/*
 * navigationRef — para navegar desde fuera de una pantalla.
 *
 * FavoritosProvider necesita poder mandar a la pantalla de entrar cuando se
 * toca un corazón sin sesión, y vive por fuera del NavigationContainer (envuelve
 * a toda la app, incluido el árbol de navegación). Sin este ref no tendría
 * forma de llamar a `navigation.navigate`.
 *
 * `destinoPendiente` es lo mismo que antes vivía como `useRef` dentro de
 * `App.js`: a dónde iba quien tuvo que pasar por el login primero. Ahora vive
 * aquí porque quien lo necesita —la barra de abajo, el carrito, el login— ya
 * no comparte un mismo componente padre.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const destinoPendiente = { current: null };

// Se pone en `true` la primera vez que se resuelve el arranque (sesión
// restaurada o no). Antes de eso, un cambio de `isAuthenticated` es el propio
// arranque resolviéndose y no un login interactivo — ver RootNavigator.
export const arranqueResuelto = { current: false };

export const navegarA = (nombre, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(nombre, params);
  }
};

// A dónde cae quien acaba de autenticarse: al apartado pendiente si lo había,
// o a la tienda. `Carrito` es un caso aparte porque no es un apartado de la
// barra de abajo, sino una pantalla suelta encima de ella.
export const irATabs = (destino) => {
  if (!navigationRef.isReady()) return;

  if (destino === 'Carrito') {
    navigationRef.reset({ index: 1, routes: [{ name: 'Tabs' }, { name: 'Carrito' }] });
    return;
  }

  navigationRef.reset({
    index: 0,
    routes: [{ name: 'Tabs', state: destino ? { routes: [{ name: destino }] } : undefined }],
  });
};
