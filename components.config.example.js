/**
 * Component Configuration
 * Defines which components are available and their associated tools
 * Components are imported directly to enable dynamic registration
 */

import { WeatherWidget } from './examples/components/WeatherWidget';
import { ProductList } from './examples/components/ProductList';
import { ProductDetail } from './examples/components/ProductDetail';
import { CartView } from './examples/components/CartView';
import { UserCarts } from './examples/components/UserCarts';
import { UserProfile } from './examples/components/UserProfile';
import { Login } from './examples/components/Login';

export const components = {
  'weather-widget': {
    component: WeatherWidget,
    tools: ['get_weather', 'get_forecast', 'get_current_weather']
  },
  'product-list': {
    component: ProductList,
    tools: ['get_products']
  },
  'product-detail': {
    component: ProductDetail,
    tools: ['get_product']
  },
  'cart-view': {
    component: CartView,
    tools: ['get_cart', 'add_cart', 'update_cart']
  },
  'user-carts': {
    component: UserCarts,
    tools: ['get_carts', 'get_user_carts']
  },
  'user-profile': {
    component: UserProfile,
    tools: ['get_user']
  },
  'login': {
    component: Login,
    tools: []
  }
};