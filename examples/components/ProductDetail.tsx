/**
 * Product Detail Component
 * Displays detailed information about a single product
 */

import { useComponentContext, useTheme, useComponentState } from '../../src/lib/use-open-apps';
import { useState } from 'react';

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export function ProductDetail() {
  const { toolOutput, callTool, sendFollowup } = useComponentContext<any, Product>();
  const theme = useTheme();
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [favorites, setFavorites] = useComponentState<number[]>([]);

  const product = toolOutput;

  if (!product) {
    return (
      <div className={`p-8 text-center rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="text-lg opacity-70">Product not found</p>
      </div>
    );
  }

  const isFavorite = favorites?.includes(product.id);

  const toggleFavorite = () => {
    setFavorites(prev =>
      prev?.includes(product.id)
        ? prev.filter(id => id !== product.id)
        : [...(prev || []), product.id]
    );
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await callTool('add_cart', {
        userId: 1, // TODO: Get from auth context
        date: new Date().toISOString().split('T')[0],
        products: [{ productId: product.id, quantity }]
      });
      await sendFollowup('Show me my cart');
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    await sendFollowup('I want to checkout');
  };

  const getRatingStars = (rate: number) => {
    const fullStars = Math.floor(rate);
    const hasHalfStar = rate % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '½' : '') + '☆'.repeat(emptyStars);
  };

  const getRatingColor = (rate: number) => {
    if (rate >= 4.5) return 'text-green-500';
    if (rate >= 4.0) return 'text-blue-500';
    if (rate >= 3.5) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className={`product-detail max-w-6xl mx-auto ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`rounded-lg overflow-hidden ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } shadow-xl`}>
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Product Image Section */}
          <div className="relative">
            <div className="sticky top-4">
              <div className={`rounded-lg overflow-hidden ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
              } p-8`}>
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-96 object-contain"
                />
              </div>
              
              {/* Image Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={toggleFavorite}
                  className={`flex-1 py-3 rounded-lg transition-all ${
                    isFavorite
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                </button>
                <button
                  className={`px-4 py-3 rounded-lg transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                  title="Share"
                >
                  🔗
                </button>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="flex flex-col">
            {/* Category Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {product.category}
              </span>
            </div>

            {/* Title */}
            <h1 className={`text-3xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getRatingStars(product.rating.rate)}</span>
                <span className={`text-lg font-semibold ${getRatingColor(product.rating.rate)}`}>
                  {product.rating.rate.toFixed(1)}
                </span>
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                ({product.rating.count} reviews)
              </span>
            </div>

            {/* Price */}
            <div className={`mb-6 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  ${product.price.toFixed(2)}
                </span>
                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Free shipping
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Description
              </h3>
              <p className={`leading-relaxed ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {product.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`w-10 h-10 rounded-lg font-bold ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-20 h-10 text-center rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={`w-10 h-10 rounded-lg font-bold ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  +
                </button>
                <span className={`text-sm ml-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total: ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={`flex-1 py-4 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700'
                    : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {isAddingToCart ? '⏳ Adding...' : '🛒 Add to Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className={`flex-1 py-4 rounded-lg font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-700'
                    : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {isAddingToCart ? '⏳ Processing...' : '⚡ Buy Now'}
              </button>
            </div>

            {/* Additional Info */}
            <div className={`mt-6 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              <div className={`text-sm space-y-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free returns within 30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Satisfaction guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
