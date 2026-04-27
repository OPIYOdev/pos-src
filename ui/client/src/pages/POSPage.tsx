import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormInput } from '@/components/common/FormInput';
import { DataTable } from '@/components/common/DataTable';
import {
  ShoppingCart,
  Package,
  FileText,
  Users,
  Settings,
  Search,
  Plus,
  Trash2,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'POS',
    href: '/pos',
    icon: <ShoppingCart size={20} />,
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: <Package size={20} />,
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: <FileText size={20} />,
  },
  {
    label: 'Users',
    href: '/users',
    icon: <Users size={20} />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={20} />,
  },
];

export const POSPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Mock products
  const products = [
    { id: '1', name: 'Paracetamol 500mg', price: 50, stock: 100 },
    { id: '2', name: 'Amoxicillin 250mg', price: 120, stock: 45 },
    { id: '3', name: 'Ibuprofen 400mg', price: 75, stock: 200 },
    { id: '4', name: 'Aspirin 100mg', price: 40, stock: 150 },
  ];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map(item =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(
        cart.map(item =>
          item.id === id
            ? { ...item, quantity, total: quantity * item.price }
            : item
        )
      );
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartItems = cart.length;

  return (
    <ProtectedRoute requiredRoles={['admin', 'user']}>
      <DashboardLayout sidebarItems={sidebarItems}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">POS Terminal</h1>
            <p className="text-muted-foreground">Process sales and manage transactions</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Products</h2>

                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                        <p className="font-bold text-lg">KES {product.price}</p>
                      </div>
                      <Button
                        onClick={() => addToCart(product)}
                        size="sm"
                        className="w-full"
                        disabled={product.stock === 0}
                      >
                        <Plus size={16} className="mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Cart Section */}
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Shopping Cart</h2>

                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Cart is empty
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="border-b border-border pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              KES {item.price} x {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">KES {item.total}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="flex-1 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart Summary */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Items:</span>
                    <span className="font-semibold">{cartItems}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">KES {cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-4 space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-4">
                    <Button className="w-full" size="lg" disabled={cart.length === 0}>
                      <DollarSign size={18} className="mr-2" />
                      Complete Sale
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCart([])}
                    >
                      Clear Cart
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default POSPage;
