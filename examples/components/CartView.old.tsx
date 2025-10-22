/**
 * Cart View Component
 * Displays shopping cart with products and checkout options
 */

import { useComponentContext, useTheme } from '../../src/lib/use-open-apps';
import { useState } from 'react';

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

export function CartView() {
  const { toolOutput, callTool, sendFollowup } = useComponentContext<any, Cart>();
  const theme = useTheme();
  const [updating, setUpdating] = useState<number | null>(null);

  const cart = toolOutput;

  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className={`p-8 text-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Add some products to get started!
        </p>
        <button
          onClick={() => sendFollowup('Show me all products')}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          Browse Products
        </button>
      </div>
    );
  }

  const handleUpdateQuantity = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(productId);
    try {
      const updatedProducts = cart.products.map(p =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      );

      await callTool('update_cart', {
        id: cart.id,
        userId: cart.userId,
        date: cart.date,
        products: updatedProducts
      });
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    setUpdating(productId);
    try {
      const updatedProducts = cart.products.filter(p => p.productId !== productId);

      if (updatedProducts.length === 0) {
        await callTool('delete_cart', { id: cart.id });
      } else {
        await callTool('update_cart', {
          id: cart.id,
          userId: cart.userId,
          date: cart.date,
          products: updatedProducts
        });
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleCheckout = async () => {
    await sendFollowup('I want to proceed to checkout');
  };

  const handleViewProduct = async (productId: number) => {
    await callTool('get_product', { id: productId });
  };

  // Note: In a real app, we'd fetch product details for each item
  // For now, we'll show product IDs and allow quantity management
  const itemCount = cart.products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className={`cart-view max-w-4xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Header */}
      <div className={`rounded-lg p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-lg`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              🛒 Shopping Cart
            </h1>
            <p className={`text-sm mt-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </p>
          </div>
          <button
            onClick={() => sendFollowup('Show me all products')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            ← Continue Shopping
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-4">
          {cart.products.map((item) => (
            <div
              key={item.productId}
              className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg transition-all ${
                updating === item.productId ? 'opacity-50' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Product Image Placeholder */}
                <div className={`w-24 h-24 rounded-lg flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <span className="text-4xl">📦</span>
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        Product #{item.productId}
                      </h3>
                      <button
                        onClick={() => handleViewProduct(item.productId)}
                        className={`text-sm ${
                          theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        View details →
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      disabled={updating === item.productId}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-30'
                          : 'text-red-600 hover:bg-red-50'
                      } disabled:opacity-50`}
                      title="Remove from cart"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Quantity:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={updating === item.productId || item.quantity <= 1}
                        className={`w-8 h-8 rounded font-bold ${
                          theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        −
                      </button>
                      <span className={`w-12 text-center font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={updating === item.productId}
                        className={`w-8 h-8 rounded font-bold ${
                          theme === 'dark'
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className={`rounded-lg p-6 sticky top-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Order Summary
            </h2>

            <div className={`space-y-3 mb-6 pb-6 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`flex justify-between ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span>Items ({itemCount})</span>
                <span>--</span>
              </div>
              <div className={`flex justify-between ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span>Shipping</span>
                <span className="text-green-500 font-semibold">FREE</span>
              </div>
            </div>

            <div className={`flex justify-between text-lg font-bold mb-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <span>Total</span>
              <span>--</span>
            </div>

            <button
              onClick={handleCheckout}
              className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Proceed to Checkout
            </button>

            <div className={`mt-4 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <div className={`text-sm space-y-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free shipping</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
