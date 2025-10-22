import { useComponentContext, useTheme } from '../../src/lib/use-open-apps';
import './ProductList.css';

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

export function ProductList() {
  const { toolOutput } = useComponentContext();
  const theme = useTheme();
  
  const products = toolOutput?.products || [];

  if (!products.length) {
    return (
      <div className="product-list-empty">
        No products found
      </div>
    );
  }

  return (
    <div className="product-list-container">
      {products.slice(0, 5).map((product: Product) => (
        <div
          key={product.id}
          className={`product-card ${theme}`}
        >
          <img
            src={product.image}
            alt={product.title}
            className="product-image"
          />
          
          <div className="product-info">
            <div className={`product-title ${theme}`}>
              {product.title}
            </div>
            
            <div className="product-rating">
              {'⭐'.repeat(Math.floor(product.rating.rate))} {product.rating.rate.toFixed(1)}
            </div>
            
            <div className="product-footer">
              <span className={`product-price ${theme}`}>
                ${product.price}
              </span>
              
              <span className={`product-category ${theme}`}>
                {product.category}
              </span>
            </div>
          </div>
        </div>
      ))}
      
      {products.length > 5 && (
        <div className="product-list-more">
          +{products.length - 5} more products
        </div>
      )}
    </div>
  );
}
