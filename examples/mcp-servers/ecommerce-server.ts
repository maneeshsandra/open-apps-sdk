#!/usr/bin/env bun

/**
 * Example MCP Server: E-commerce Service
 * Provides product browsing, cart management, and user authentication
 * Uses the Fake Store API: https://fakestoreapi.com
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(
  {
    name: 'ecommerce-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

const FAKE_STORE_API = 'https://fakestoreapi.com';

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Product Tools
      {
        name: 'get_products',
        description: 'Get all products or filter by category. Returns a list of products with their details including title, price, description, category, image, and rating.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter (e.g., "electronics", "jewelery", "men\'s clothing", "women\'s clothing")',
            },
            limit: {
              type: 'number',
              description: 'Limit the number of results (optional)',
            },
            sort: {
              type: 'string',
              description: 'Sort order: "asc" or "desc" (optional)',
              enum: ['asc', 'desc'],
            },
          },
        },
        _meta: {
          componentId: 'product-list',
          componentAccessible: true,
          toolInvoking: 'Fetching products...',
          toolInvoked: 'Products retrieved',
        },
      },
      {
        name: 'get_product',
        description: 'Get detailed information for a specific product by ID. Returns complete product details including title, price, description, category, image, and rating.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Product ID',
            },
          },
          required: ['id'],
        },
        _meta: {
          componentId: 'product-detail',
          componentAccessible: true,
          toolInvoking: 'Fetching product details...',
          toolInvoked: 'Product details retrieved',
        },
      },
      {
        name: 'get_categories',
        description: 'Get all available product categories. Returns a list of category names.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        _meta: {
          toolInvoking: 'Fetching categories...',
          toolInvoked: 'Categories retrieved',
        },
      },
      
      // Cart Tools
      {
        name: 'get_carts',
        description: 'Get all carts or filter by date range. Returns a list of shopping carts.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Limit the number of results (optional)',
            },
            sort: {
              type: 'string',
              description: 'Sort order: "asc" or "desc" (optional)',
              enum: ['asc', 'desc'],
            },
            startdate: {
              type: 'string',
              description: 'Start date for filtering (YYYY-MM-DD format, optional)',
            },
            enddate: {
              type: 'string',
              description: 'End date for filtering (YYYY-MM-DD format, optional)',
            },
          },
        },
      },
      {
        name: 'get_cart',
        description: 'Get a specific cart by ID. Returns cart details with product list.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Cart ID',
            },
          },
          required: ['id'],
        },
        _meta: {
          componentId: 'cart-view',
          componentAccessible: true,
          toolInvoking: 'Fetching cart...',
          toolInvoked: 'Cart retrieved',
        },
      },
      {
        name: 'get_user_carts',
        description: 'Get all carts for a specific user. Returns all shopping carts belonging to the user.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
              description: 'User ID',
            },
          },
          required: ['userId'],
        },
        _meta: {
          componentId: 'user-carts',
          componentAccessible: true,
          toolInvoking: 'Fetching user carts...',
          toolInvoked: 'User carts retrieved',
        },
      },
      {
        name: 'add_cart',
        description: 'Create a new shopping cart for a user. Returns the created cart with an assigned ID.',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'number',
              description: 'User ID',
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
            },
            products: {
              type: 'array',
              description: 'Array of products with productId and quantity',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'number',
                    description: 'Product ID',
                  },
                  quantity: {
                    type: 'number',
                    description: 'Quantity',
                  },
                },
                required: ['productId', 'quantity'],
              },
            },
          },
          required: ['userId', 'date', 'products'],
        },
        _meta: {
          toolInvoking: 'Creating cart...',
          toolInvoked: 'Cart created',
        },
      },
      {
        name: 'update_cart',
        description: 'Update an existing cart. Returns the updated cart. Note: Fake Store API simulates updates but doesn\'t persist changes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Cart ID to update',
            },
            userId: {
              type: 'number',
              description: 'User ID',
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
            },
            products: {
              type: 'array',
              description: 'Array of products with productId and quantity',
              items: {
                type: 'object',
                properties: {
                  productId: {
                    type: 'number',
                    description: 'Product ID',
                  },
                  quantity: {
                    type: 'number',
                    description: 'Quantity',
                  },
                },
                required: ['productId', 'quantity'],
              },
            },
          },
          required: ['id', 'userId', 'date', 'products'],
        },
        _meta: {
          toolInvoking: 'Updating cart...',
          toolInvoked: 'Cart updated',
        },
      },
      {
        name: 'delete_cart',
        description: 'Delete a cart by ID. Returns the deleted cart. Note: Fake Store API simulates deletion but doesn\'t persist changes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Cart ID to delete',
            },
          },
          required: ['id'],
        },
        _meta: {
          toolInvoking: 'Deleting cart...',
          toolInvoked: 'Cart deleted',
        },
      },
      
      // User Tools
      {
        name: 'get_users',
        description: 'Get all users or limit the results. Returns a list of users with their information.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Limit the number of results (optional)',
            },
            sort: {
              type: 'string',
              description: 'Sort order: "asc" or "desc" (optional)',
              enum: ['asc', 'desc'],
            },
          },
        },
      },
      {
        name: 'get_user',
        description: 'Get a specific user by ID. Returns user details including name, email, phone, and address.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User ID',
            },
          },
          required: ['id'],
        },
        _meta: {
          componentId: 'user-profile',
          componentAccessible: true,
          toolInvoking: 'Fetching user details...',
          toolInvoked: 'User details retrieved',
        },
      },
      {
        name: 'add_user',
        description: 'Create a new user. Returns the created user with an assigned ID.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            password: {
              type: 'string',
              description: 'Password',
            },
            name: {
              type: 'object',
              description: 'User name object',
              properties: {
                firstname: {
                  type: 'string',
                  description: 'First name',
                },
                lastname: {
                  type: 'string',
                  description: 'Last name',
                },
              },
              required: ['firstname', 'lastname'],
            },
            address: {
              type: 'object',
              description: 'User address',
              properties: {
                city: {
                  type: 'string',
                  description: 'City',
                },
                street: {
                  type: 'string',
                  description: 'Street',
                },
                number: {
                  type: 'number',
                  description: 'Street number',
                },
                zipcode: {
                  type: 'string',
                  description: 'Zip code',
                },
                geolocation: {
                  type: 'object',
                  properties: {
                    lat: {
                      type: 'string',
                      description: 'Latitude',
                    },
                    long: {
                      type: 'string',
                      description: 'Longitude',
                    },
                  },
                },
              },
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
          },
          required: ['email', 'username', 'password', 'name'],
        },
      },
      {
        name: 'update_user',
        description: 'Update an existing user. Returns the updated user. Note: Fake Store API simulates updates but doesn\'t persist changes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User ID to update',
            },
            email: {
              type: 'string',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            password: {
              type: 'string',
              description: 'Password',
            },
            name: {
              type: 'object',
              description: 'User name object',
              properties: {
                firstname: {
                  type: 'string',
                  description: 'First name',
                },
                lastname: {
                  type: 'string',
                  description: 'Last name',
                },
              },
            },
            address: {
              type: 'object',
              description: 'User address',
            },
            phone: {
              type: 'string',
              description: 'Phone number',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_user',
        description: 'Delete a user by ID. Returns the deleted user. Note: Fake Store API simulates deletion but doesn\'t persist changes.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'User ID to delete',
            },
          },
          required: ['id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    // Product Tools
    if (name === 'get_products') {
      const { category, limit, sort } = args as any;
      let url = category 
        ? `${FAKE_STORE_API}/products/category/${category}`
        : `${FAKE_STORE_API}/products`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const products = await fetch(url).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${products.length} products${category ? ` in category "${category}"` : ''}`,
          },
        ],
        structuredContent: {
          products,
          category: category || 'all',
          count: products.length,
        },
      };
    }

    if (name === 'get_product') {
      const { id } = args as any;
      const product = await fetch(`${FAKE_STORE_API}/products/${id}`).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Product: ${product.title} - $${product.price}\nCategory: ${product.category}\nRating: ${product.rating?.rate || 'N/A'} (${product.rating?.count || 0} reviews)`,
          },
        ],
        structuredContent: product,
      };
    }

    if (name === 'get_categories') {
      const categories = await fetch(`${FAKE_STORE_API}/products/categories`).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Available categories: ${categories.join(', ')}`,
          },
        ],
        structuredContent: {
          categories,
          count: categories.length,
        },
      };
    }

    // Cart Tools
    if (name === 'get_carts') {
      const { limit, sort, startdate, enddate } = args as any;
      let url = `${FAKE_STORE_API}/carts`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      if (startdate) params.append('startdate', startdate);
      if (enddate) params.append('enddate', enddate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const carts = await fetch(url).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${carts.length} carts`,
          },
        ],
        structuredContent: {
          carts,
          count: carts.length,
        },
      };
    }

    if (name === 'get_cart') {
      const { id } = args as any;
      const cart = await fetch(`${FAKE_STORE_API}/carts/${id}`).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Cart ${cart.id} has ${cart.products?.length || 0} items`,
          },
        ],
        structuredContent: cart,
      };
    }

    if (name === 'get_user_carts') {
      const { userId } = args as any;
      const carts = await fetch(`${FAKE_STORE_API}/carts/user/${userId}`).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `User ${userId} has ${carts.length} cart(s)`,
          },
        ],
        structuredContent: {
          carts,
          userId,
          count: carts.length,
        },
      };
    }

    if (name === 'add_cart') {
      const { userId, date, products } = args as any;
      const cart = await fetch(`${FAKE_STORE_API}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, date, products }),
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Cart created with ID ${cart.id} for user ${userId}`,
          },
        ],
        structuredContent: cart,
      };
    }

    if (name === 'update_cart') {
      const { id, userId, date, products } = args as any;
      const cart = await fetch(`${FAKE_STORE_API}/carts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, date, products }),
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Cart ${id} updated successfully`,
          },
        ],
        structuredContent: cart,
      };
    }

    if (name === 'delete_cart') {
      const { id } = args as any;
      const cart = await fetch(`${FAKE_STORE_API}/carts/${id}`, {
        method: 'DELETE',
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Cart ${id} deleted successfully`,
          },
        ],
        structuredContent: cart,
      };
    }

    // User Tools
    if (name === 'get_users') {
      const { limit, sort } = args as any;
      let url = `${FAKE_STORE_API}/users`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (sort) params.append('sort', sort);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const users = await fetch(url).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `Found ${users.length} users`,
          },
        ],
        structuredContent: {
          users,
          count: users.length,
        },
      };
    }

    if (name === 'get_user') {
      const { id } = args as any;
      const user = await fetch(`${FAKE_STORE_API}/users/${id}`).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `User: ${user.name?.firstname} ${user.name?.lastname}\nEmail: ${user.email}\nPhone: ${user.phone}`,
          },
        ],
        structuredContent: user,
      };
    }

    if (name === 'add_user') {
      const userData = args as any;
      const user = await fetch(`${FAKE_STORE_API}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `User created with ID ${user.id}`,
          },
        ],
        structuredContent: user,
      };
    }

    if (name === 'update_user') {
      const { id, ...userData } = args as any;
      const user = await fetch(`${FAKE_STORE_API}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `User ${id} updated successfully`,
          },
        ],
        structuredContent: user,
      };
    }

    if (name === 'delete_user') {
      const { id } = args as any;
      const user = await fetch(`${FAKE_STORE_API}/users/${id}`, {
        method: 'DELETE',
      }).then(r => r.json());
      
      return {
        content: [
          {
            type: 'text',
            text: `User ${id} deleted successfully`,
          },
        ],
        structuredContent: user,
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List resources (for UI components)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ecommerce://product-list',
        name: 'Product List',
        description: 'Interactive product listing component',
        mimeType: 'application/x-react-component',
      },
      {
        uri: 'ecommerce://product-detail',
        name: 'Product Detail',
        description: 'Product detail view component',
        mimeType: 'application/x-react-component',
      },
      {
        uri: 'ecommerce://cart-view',
        name: 'Shopping Cart',
        description: 'Shopping cart component',
        mimeType: 'application/x-react-component',
      },
      {
        uri: 'ecommerce://user-profile',
        name: 'User Profile',
        description: 'User profile component',
        mimeType: 'application/x-react-component',
      },
    ],
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('E-commerce MCP Server started');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
