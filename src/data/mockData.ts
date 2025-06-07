
import { Product, Category, Order, Address } from "./models";

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Hardwood",
    image: "/placeholder.svg",
    count: 8
  },
  {
    id: "cat-2",
    name: "Coconut Shell",
    image: "/placeholder.svg",
    count: 5
  },
  {
    id: "cat-3",
    name: "Briquettes",
    image: "/placeholder.svg",
    count: 10
  },
  {
    id: "cat-4",
    name: "Lump Charcoal",
    image: "/placeholder.svg",
    count: 7
  },
  {
    id: "cat-5",
    name: "Premium",
    image: "/placeholder.svg",
    count: 4
  }
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Premium Oak Hardwood Charcoal",
    type: "Hardwood",
    price: 19.99,
    description: "High-quality oak hardwood charcoal perfect for grilling and smoking. Long-lasting with excellent heat retention and minimal ash. Ideal for both direct and indirect cooking methods.",
    specifications: {
      "Weight": "10 lbs",
      "Moisture Content": "5%",
      "Ash Content": "2%",
      "Burn Time": "3-4 hours",
      "Size": "Medium to Large pieces"
    },
    origin: "USA",
    seller: "GrillMaster Supplies",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.8,
    reviewCount: 124,
    inStock: true,
    featured: true
  },
  {
    id: "prod-2",
    name: "Coconut Shell Charcoal Briquettes",
    type: "Coconut Shell",
    price: 14.99,
    description: "Eco-friendly coconut shell charcoal briquettes that burn clean with minimal smoke. Perfect for grilling seafood, vegetables, and delicate meats.",
    specifications: {
      "Weight": "5 lbs",
      "Moisture Content": "4%",
      "Ash Content": "1.5%",
      "Burn Time": "2-3 hours",
      "Shape": "Uniform briquettes"
    },
    origin: "Indonesia",
    seller: "EcoGrill Products",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.6,
    reviewCount: 87,
    inStock: true
  },
  {
    id: "prod-3",
    name: "Traditional Mesquite Lump Charcoal",
    type: "Lump Charcoal",
    price: 22.99,
    description: "Traditional mesquite lump charcoal with rich, smoky flavor. Irregular pieces for excellent airflow and high heat cooking. Perfect for steaks and burgers.",
    specifications: {
      "Weight": "15 lbs",
      "Moisture Content": "6%",
      "Ash Content": "3%",
      "Burn Time": "2-3 hours",
      "Size": "Mixed sizes"
    },
    origin: "Mexico",
    seller: "Authentic BBQ Supplies",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.7,
    reviewCount: 156,
    inStock: true,
    discount: 10
  },
  {
    id: "prod-4",
    name: "Premium Binchotan Japanese Charcoal",
    type: "Premium",
    price: 39.99,
    description: "High-grade Japanese binchotan charcoal, traditionally used in yakitori cooking. Extremely high heat with virtually no smoke or odor. Burns for exceptionally long periods.",
    specifications: {
      "Weight": "5 lbs",
      "Moisture Content": "3%",
      "Ash Content": "1%",
      "Burn Time": "5-6 hours",
      "Size": "Medium sticks"
    },
    origin: "Japan",
    seller: "Culinary Traditions",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.9,
    reviewCount: 42,
    inStock: true,
    featured: true
  },
  {
    id: "prod-5",
    name: "Quick-Light Charcoal Briquettes",
    type: "Briquettes",
    price: 9.99,
    description: "Easy-to-light charcoal briquettes with consistent size and performance. Ready to cook in 15 minutes with predictable heat output.",
    specifications: {
      "Weight": "8 lbs",
      "Moisture Content": "5%",
      "Ash Content": "4%",
      "Burn Time": "1-2 hours",
      "Shape": "Uniform pillows"
    },
    origin: "USA",
    seller: "QuickGrill",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.2,
    reviewCount: 198,
    inStock: true,
    discount: 15
  },
  {
    id: "prod-6",
    name: "Hickory Wood Lump Charcoal",
    type: "Hardwood",
    price: 17.99,
    description: "Pure hickory wood charcoal with robust flavor. Great for smoking ribs, pork shoulder, and other meats where a pronounced smoky taste is desired.",
    specifications: {
      "Weight": "10 lbs",
      "Moisture Content": "5%",
      "Ash Content": "2.5%",
      "Burn Time": "3 hours",
      "Size": "Various sizes"
    },
    origin: "USA",
    seller: "Smoke House Fuels",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.7,
    reviewCount: 76,
    inStock: true
  },
  {
    id: "prod-7",
    name: "Eco-Friendly Compressed Sawdust Briquettes",
    type: "Briquettes",
    price: 11.99,
    description: "Environmentally friendly briquettes made from compressed sawdust. Low smoke and consistent heat make them ideal for backyard grilling.",
    specifications: {
      "Weight": "12 lbs",
      "Moisture Content": "7%",
      "Ash Content": "3%",
      "Burn Time": "2 hours",
      "Shape": "Round discs"
    },
    origin: "Canada",
    seller: "Green Grilling Co.",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.3,
    reviewCount: 58,
    inStock: false
  },
  {
    id: "prod-8",
    name: "Restaurant-Grade Coconut Charcoal",
    type: "Coconut Shell",
    price: 29.99,
    description: "Commercial quality coconut shell charcoal used by professional chefs. Extremely consistent with high heat output and minimal ash.",
    specifications: {
      "Weight": "20 lbs",
      "Moisture Content": "3%",
      "Ash Content": "1%",
      "Burn Time": "4 hours",
      "Size": "Medium chunks"
    },
    origin: "Philippines",
    seller: "Chef's Choice BBQ",
    images: ["/placeholder.svg", "/placeholder.svg"],
    rating: 4.9,
    reviewCount: 112,
    inStock: true,
    featured: true
  }
];

export const mockAddresses: Address[] = [
  {
    id: "addr-1",
    name: "Home",
    street: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    country: "USA",
    isDefault: true
  },
  {
    id: "addr-2",
    name: "Work",
    street: "456 Office Blvd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    country: "USA",
    isDefault: false
  }
];

export const mockOrders: Order[] = [
  {
    id: "order-1",
    date: "2023-04-15",
    status: "delivered",
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Premium Oak Hardwood Charcoal",
        quantity: 2,
        price: 19.99
      },
      {
        id: "item-2",
        productId: "prod-4",
        productName: "Premium Binchotan Japanese Charcoal",
        quantity: 1,
        price: 39.99
      }
    ],
    total: 79.97,
    shippingAddress: mockAddresses[0],
    paymentMethod: "Credit Card",
    trackingNumber: "TRK12345678"
  },
  {
    id: "order-2",
    date: "2023-05-02",
    status: "shipped",
    items: [
      {
        id: "item-3",
        productId: "prod-2",
        productName: "Coconut Shell Charcoal Briquettes",
        quantity: 1,
        price: 14.99
      }
    ],
    total: 14.99,
    shippingAddress: mockAddresses[1],
    paymentMethod: "PayPal",
    trackingNumber: "TRK98765432"
  }
];
