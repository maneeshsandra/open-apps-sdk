import { useComponentContext, useTheme } from '../../src/lib/use-open-apps';
import { useState } from 'react';
import './CartView.css';

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
  const { toolOutput } = useComponentContext<any, Cart>();
  const theme = useTheme();
  const [updating, setUpdating] = useState<number | null>(null);

  const cart = toolOutput;

  if (!cart || !cart.products || cart.products.length === 0) {
    return (
      <div className={`cart-empty ${theme}`}>
        <div className="cart-empty-icon">🛒</div>
        <div className="cart-empty-title">Cart is empty</div>
        <div className="cart-empty-text">Add products to get started</div>
      </div>
    );
  }

  const itemCount = cart.products.reduce((sum, p) => sum + p.quantity, 0);
  const mockTotal = cart.products.reduce((sum, p) => sum + (p.quantity * 29.99), 0); // Mock pricing

  return (
    <div className="cart-container">
      {cart.products.map((item) => (
        <div key={item.productId} className={`cart-item ${theme}`}>
          <div className="cart-item-image" style={{
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            📦
          </div>
          
          <div className="cart-item-info">
            <div className="cart-item-name">Product #{item.productId}</div>
            <div className="cart-item-details">In Stock</div>
            <div className={`cart-item-price ${theme}`}>
              ${(29.99 * item.quantity).toFixed(2)}
            </div>
            
            <div className="cart-qty-control">
              <button 
                className={`cart-qty-btn ${theme}`}
                disabled={updating === item.productId || item.quantity <= 1}
              >
                −
              </button>
              <span className="cart-qty-value">{item.quantity}</span>
              <button 
                className={`cart-qty-btn ${theme}`}
                disabled={updating === item.productId}
              >
                +
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className={`cart-summary ${theme}`}>
        <div className="cart-summary-row">
          <span>Subtotal ({itemCount} items)</span>
          <span>${mockTotal.toFixed(2)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Shipping</span>
          <span>$5.99</span>
        </div>
        <div className={`cart-summary-row total ${theme}`}>
          <span>Total</span>
          <span>${(mockTotal + 5.99).toFixed(2)}</span>
        </div>
        
        <button className={`cart-checkout-btn ${theme}`}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
