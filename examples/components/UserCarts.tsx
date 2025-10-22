/**
 * User Carts Component
 * Displays all carts belonging to a user
 */

import { useComponentContext, useTheme } from '../../src/lib/use-open-apps';

interface CartProduct {
  productId: number;
  quantity: number;
}

interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartProduct[];
}

interface UserCartsOutput {
  carts: Cart[];
  userId: number;
  count: number;
}

export function UserCarts() {
  const { toolOutput, callTool } = useComponentContext<any, UserCartsOutput>();
  const theme = useTheme();

  const carts = toolOutput?.carts || [];

  const handleViewCart = async (cartId: number) => {
    try {
      await callTool('get_cart', { id: cartId });
    } catch (error) {
      console.error('Failed to get cart:', error);
    }
  };

  const handleDeleteCart = async (cartId: number) => {
    try {
      await callTool('delete_cart', { id: cartId });
    } catch (error) {
      console.error('Failed to delete cart:', error);
    }
  };

  if (!carts.length) {
    return (
      <div className={`p-8 text-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">No carts found</h2>
        <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          You haven't created any shopping carts yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`user-carts max-w-4xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Header */}
      <div className={`rounded-lg p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        <h1 className={`text-3xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          🛒 Your Shopping Carts
        </h1>
        <p className={`text-sm mt-1 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          You have {carts.length} {carts.length === 1 ? 'cart' : 'carts'}
        </p>
      </div>

      {/* Carts List */}
      <div className="space-y-4">
        {carts.map((cart) => {
          const itemCount = cart.products.reduce((sum, p) => sum + p.quantity, 0);
          const productCount = cart.products.length;
          const cartDate = new Date(cart.date);

          return (
            <div
              key={cart.id}
              className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg hover:shadow-xl transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Cart #{cart.id}
                  </h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Created: {cartDate.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewCart(cart.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => handleDeleteCart(cart.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title="Delete cart"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Cart Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {productCount}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Unique Products
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {itemCount}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Items
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                    #{cart.id}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Cart ID
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    #{cart.userId}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    User ID
                  </div>
                </div>
              </div>

              {/* Products Preview */}
              <div className="mt-4">
                <div className={`text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Products in cart:
                </div>
                <div className="flex flex-wrap gap-2">
                  {cart.products.map((product, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      Product #{product.productId} × {product.quantity}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
