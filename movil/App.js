/*
 * ============================================================
 * CARTIFY MÓVIL — entrada de la app
 * ============================================================
 * Por ahora arranca DIRECTO en la tienda (Home), sin pasar por login.
 * El flujo de sesión (LoginClient, Register, Verification, Bienvenida)
 * se deja importado y disponible, pero no es la puerta de entrada mientras
 * se prueba la parte de la tienda.
 * ============================================================
 */

import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/Usuario/CartContext';

import HomeScreen from './src/pages/Usuario/HomeScreen';
import SearchScreen from './src/pages/Usuario/SearchScreen';
import SearchResultsScreen from './src/pages/Usuario/SearchResultsScreen';
import ProductDetailScreen from './src/pages/Usuario/ProductDetailScreen';
import CartScreen from './src/pages/Usuario/CartScreen';
import OrderDetailScreen from './src/pages/Usuario/OrderDetailScreen';

const Navegacion = () => {
  const [pantalla, setPantalla] = useState('home');
  const [params, setParams] = useState({});

  const navegar = (nombre, nuevosParams = {}) => {
    setPantalla(nombre);
    setParams(nuevosParams);
  };

  switch (pantalla) {
    case 'search':
      return (
        <SearchScreen
          navigation={{ navigate: navegar, goBack: () => navegar('home') }}
        />
      );
    case 'searchResults':
      return (
        <SearchResultsScreen
          route={{ params }}
          navigation={{ navigate: navegar, goBack: () => navegar('search') }}
        />
      );
    case 'productDetail':
      return (
        <ProductDetailScreen
          route={{ params }}
          navigation={{ navigate: navegar, goBack: () => navegar('home'), push: navegar }}
        />
      );
    case 'cart':
      return (
        <CartScreen
          navigation={{ navigate: navegar, goBack: () => navegar('home') }}
        />
      );
    case 'orderDetail':
      return (
        <OrderDetailScreen
          route={{ params }}
          navigation={{ navigate: navegar, goBack: () => navegar('home') }}
        />
      );
    case 'home':
    default:
      return (
        <HomeScreen navigation={{ navigate: navegar }} />
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Navegacion />
      </CartProvider>
    </AuthProvider>
  );
}