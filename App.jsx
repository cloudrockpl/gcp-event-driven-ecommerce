import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, Server, AlertTriangle, CheckCircle2, ShieldAlert, X, Trash2, Activity, Wifi, WifiOff } from 'lucide-react';

// Pre-generated list of 50 products
const PRODUCTS = [
  { id: 1, name: "MacBook Pro 16\"", price: 2499.00, category: "Laptops", icon: "💻" },
  { id: 2, name: "Dell XPS 13", price: 1299.99, category: "Laptops", icon: "💻" },
  { id: 3, name: "ThinkPad X1 Carbon", price: 1450.00, category: "Laptops", icon: "💻" },
  { id: 4, name: "Razer Blade 15", price: 2199.00, category: "Laptops", icon: "💻" },
  { id: 5, name: "Asus ROG Zephyrus", price: 1649.99, category: "Laptops", icon: "💻" },
  { id: 6, name: "HP Spectre x360", price: 1399.00, category: "Laptops", icon: "💻" },
  { id: 7, name: "LG Gram 17", price: 1599.00, category: "Laptops", icon: "💻" },
  { id: 8, name: "Microsoft Surface Laptop 5", price: 1199.99, category: "Laptops", icon: "💻" },
  { id: 9, name: "Acer Swift 3", price: 749.00, category: "Laptops", icon: "💻" },
  { id: 10, name: "Framework Laptop", price: 999.00, category: "Laptops", icon: "💻" },
  { id: 11, name: "Sony WH-1000XM5", price: 398.00, category: "Audio", icon: "🎧" },
  { id: 12, name: "AirPods Pro 2", price: 249.00, category: "Audio", icon: "🎧" },
  { id: 13, name: "Bose QuietComfort 45", price: 329.00, category: "Audio", icon: "🎧" },
  { id: 14, name: "Sennheiser Momentum 4", price: 349.00, category: "Audio", icon: "🎧" },
  { id: 15, name: "Shure SM7B Microphone", price: 399.00, category: "Audio", icon: "🎙️" },
  { id: 16, name: "Audio-Technica ATH-M50x", price: 149.00, category: "Audio", icon: "🎧" },
  { id: 17, name: "Jabra Elite 85t", price: 229.00, category: "Audio", icon: "🎧" },
  { id: 18, name: "Blue Yeti USB Mic", price: 129.99, category: "Audio", icon: "🎙️" },
  { id: 19, name: "Sonos Roam", price: 179.00, category: "Audio", icon: "🔊" },
  { id: 20, name: "Ultimate Ears MEGABOOM 3", price: 199.00, category: "Audio", icon: "🔊" },
  { id: 21, name: "Logitech MX Master 3S", price: 99.99, category: "Accessories", icon: "🖱️" },
  { id: 22, name: "Keychron Q1 Pro", price: 199.00, category: "Accessories", icon: "⌨️" },
  { id: 23, name: "Apple Magic Trackpad", price: 129.00, category: "Accessories", icon: "🖱️" },
  { id: 24, name: "NuPhy Air75", price: 109.95, category: "Accessories", icon: "⌨️" },
  { id: 25, name: "Razer DeathAdder V3", price: 69.99, category: "Accessories", icon: "🖱️" },
  { id: 26, name: "SteelSeries Apex Pro", price: 199.99, category: "Accessories", icon: "⌨️" },
  { id: 27, name: "Anker 737 Power Bank", price: 149.99, category: "Accessories", icon: "🔋" },
  { id: 28, name: "Caldigit TS4 Dock", price: 399.95, category: "Accessories", icon: "🔌" },
  { id: 29, name: "Logitech Brio 4K Webcam", price: 159.99, category: "Accessories", icon: "📷" },
  { id: 30, name: "Elgato Stream Deck MK.2", price: 149.99, category: "Accessories", icon: "🎛️" },
  { id: 31, name: "Dell UltraSharp 27\" 4K", price: 599.00, category: "Monitors", icon: "🖥️" },
  { id: 32, name: "LG 34\" Ultrawide", price: 449.99, category: "Monitors", icon: "🖥️" },
  { id: 33, name: "Samsung Odyssey G7", price: 699.99, category: "Monitors", icon: "🖥️" },
  { id: 34, name: "ASUS ProArt 27\"", price: 299.00, category: "Monitors", icon: "🖥️" },
  { id: 35, name: "BenQ ScreenBar Halo", price: 169.00, category: "Monitors", icon: "💡" },
  { id: 36, name: "Apple Studio Display", price: 1599.00, category: "Monitors", icon: "🖥️" },
  { id: 37, name: "Gigabyte M28U", price: 549.99, category: "Monitors", icon: "🖥️" },
  { id: 38, name: "Alienware 34 Curved", price: 999.99, category: "Monitors", icon: "🖥️" },
  { id: 39, name: "Nvidia RTX 4090", price: 1599.00, category: "Components", icon: "🎮" },
  { id: 40, name: "AMD Ryzen 9 7950X", price: 599.00, category: "Components", icon: "⚙️" },
  { id: 41, name: "Intel Core i9-13900K", price: 569.99, category: "Components", icon: "⚙️" },
  { id: 42, name: "Samsung 990 PRO 2TB", price: 169.99, category: "Components", icon: "💾" },
  { id: 43, name: "Corsair Vengeance 32GB DDR5", price: 114.99, category: "Components", icon: "💾" },
  { id: 44, name: "Noctua NH-D15 Cooler", price: 119.95, category: "Components", icon: "❄️" },
  { id: 45, name: "NZXT Kraken Elite", price: 279.99, category: "Components", icon: "❄️" },
  { id: 46, name: "Oculus Quest 3", price: 499.00, category: "Gadgets", icon: "🥽" },
  { id: 47, name: "Steam Deck OLED", price: 549.00, category: "Gadgets", icon: "🎮" },
  { id: 48, name: "Nintendo Switch OLED", price: 349.99, category: "Gadgets", icon: "🎮" },
  { id: 49, name: "Raspberry Pi 5 (8GB)", price: 80.00, category: "Gadgets", icon: "🍓" },
  { id: 50, name: "Flipper Zero", price: 169.00, category: "Gadgets", icon: "🐬" },
];

export default function App() {
  const [apiUrl, setApiUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('discovering'); // discovering, retrying, connected
  const [retryCount, setRetryCount] = useState(0);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Auto-hide logs after 5 seconds
  const addLog = (type, message) => {
    const newLog = { id: Date.now(), type, message };
    setLogs((prev) => [newLog, ...prev].slice(0, 5)); // Keep last 5 logs
  };

  // ----------------------------------------------------------------------
  // Auto-Discovery & Exponential Backoff Logic
  // ----------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    let delay = 1000;
    let attempt = 0;

    const pingBackendCandidates = async () => {
      // Dynamically infer the Cloud Run backend URL based on the frontend's deployed URL
      let inferredCloudRunUrl = '';
      const currentOrigin = window.location.origin;
      
      // If we are deployed on Cloud Run, the hash is the same for services in the same project/region
      // e.g., https://store-frontend-[hash]-uc.a.run.app -> https://order-service-[hash]-uc.a.run.app
      if (currentOrigin.includes('run.app') && currentOrigin.includes('store-frontend')) {
        inferredCloudRunUrl = currentOrigin.replace('store-frontend', 'order-service');
      }

      // List of potential backend URLs to ping
      const candidates = [
        window.ORDER_API_URL,     // Deployed production environment variable (if injected by pipeline)
        inferredCloudRunUrl,      // Auto-inferred Cloud Run sibling service URL
        'http://localhost:8080',  // Local Docker/Flask backend
        'http://127.0.0.1:8080',  // Local loopback
        'http://localhost:5000',  // Alternative local Flask port
        window.location.origin    // Fallback assuming same domain/proxy
      ].filter(Boolean);          // Remove undefined/empty entries

      for (const candidate of candidates) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout per ping

          // Ping the backend. A GET to /place-order will return 405 Method Not Allowed 
          // if the Flask route exists, confirming the server is alive and correct!
          const res = await fetch(`${candidate.replace(/\/$/, '')}/place-order`, {
            method: 'GET',
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.status === 405 || res.ok) {
             return candidate;
          }
        } catch (err) {
          // Ignore network failures and move to next candidate
        }
      }
      throw new Error("No backend services reachable");
    };

    const startDiscoveryLoop = async () => {
      while (isMounted) {
        try {
          setConnectionStatus(attempt === 0 ? 'discovering' : 'retrying');
          const foundUrl = await pingBackendCandidates();

          if (isMounted) {
            setApiUrl(foundUrl);
            setConnectionStatus('connected');
            addLog('success', `Automatically connected to backend at: ${foundUrl}`);
            return; // Success! Break the loop.
          }
        } catch (error) {
          attempt++;
          if (isMounted) {
            setRetryCount(attempt);
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s... (capped at 16s)
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 16000);
          }
        }
      }
    };

    startDiscoveryLoop();

    return () => { isMounted = false; };
  }, []);

  // ----------------------------------------------------------------------

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    addLog('info', `Added ${product.name} to cart.`);
  };

  const removeFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    if (connectionStatus !== 'connected' || !apiUrl) {
      addLog('error', 'Cannot checkout: Backend service is currently disconnected.');
      setIsCartOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (cart.length === 0) return;

    setIsOrdering(true);
    const orderId = `UI-ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Combine item names for the payload
    const itemNames = cart.map(p => p.name).join(', ');
    
    // Format payload to match backend schema requirements
    const payload = {
      order_id: orderId,
      item: itemNames.length > 100 ? itemNames.substring(0, 97) + '...' : itemNames,
      price: cartTotal,
      fail_billing: simulateFailure
    };

    try {
      addLog('info', `Processing checkout for order ${orderId}...`);
      
      const response = await fetch(`${apiUrl.replace(/\/$/, '')}/place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        addLog('success', `Checkout successfully! Event dispatched to Pub/Sub (ID: ${data.message_id})`);
        setCart([]); // Clear cart
        setIsCartOpen(false); // Close modal
      } else {
        addLog('error', `Server error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      addLog('error', `Network error: Connection to backend was lost.`);
      setConnectionStatus('retrying'); // Trigger reconnect loop visually if it fails
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Configuration Header */}
      <div className="bg-slate-900 text-slate-100 p-6 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Server className="text-blue-400 w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">Pub/Sub E-Commerce App</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
                <ShieldAlert className={simulateFailure ? "text-red-400 w-5 h-5" : "text-slate-500 w-5 h-5"} />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium select-none hidden sm:block">
                    Simulate Billing Failure
                  </span>
                  <span className="text-sm font-medium select-none sm:hidden">
                    DLQ Test
                  </span>
                </label>
              </div>

              {/* Cart Toggle Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-slate-900">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Dynamic Status Indicator replacing the manual input field */}
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700 flex-1">
              {connectionStatus === 'discovering' && (
                <>
                  <Activity className="w-5 h-5 text-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 font-medium text-sm">Discovering Backend Service...</span>
                </>
              )}
              {connectionStatus === 'retrying' && (
                <>
                  <WifiOff className="w-5 h-5 text-orange-400 animate-pulse" />
                  <span className="text-orange-400 font-medium text-sm">Reconnecting (Attempt {retryCount})...</span>
                </>
              )}
              {connectionStatus === 'connected' && (
                <>
                  <Wifi className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium text-sm truncate">
                    Connected: {apiUrl}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Notifications / Logs Area */}
          {logs.length > 0 && (
            <div className="mt-4 space-y-2">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className={`flex items-center space-x-2 text-sm p-3 rounded-lg animate-fade-in ${
                    log.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' :
                    log.type === 'success' ? 'bg-green-900/50 text-green-200 border border-green-800' :
                    'bg-blue-900/50 text-blue-200 border border-blue-800'
                  }`}
                >
                  {log.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                  {log.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  {log.type === 'info' && <ShoppingBag className="w-4 h-4 shrink-0 animate-pulse" />}
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Product Grid */}
      <main className="max-w-6xl mx-auto px-6 mt-12">
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-3xl font-extrabold text-slate-900">Tech Store Catalog</h2>
          <p className="text-slate-500 mt-2">Add items to your cart, then checkout to dispatch the event.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {PRODUCTS.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-40 bg-slate-100 flex items-center justify-center text-5xl">
                {product.icon}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-blue-600 uppercase mb-1 block">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">
                    {product.name}
                  </h3>
                  <div className="text-2xl font-extrabold text-slate-800 mb-4">
                    ${product.price.toFixed(2)}
                  </div>
                </div>
                
                <button
                  onClick={() => addToCart(product)}
                  className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300"
                >
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Sliding Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
                <span>Your Cart ({cart.length})</span>
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Your cart is empty.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 text-blue-600 font-semibold hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="text-3xl bg-white p-2 rounded shadow-sm">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{item.name}</h4>
                      <div className="text-slate-600">${item.price.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(index)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold text-slate-700">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={isOrdering || connectionStatus !== 'connected'}
                  className={`w-full py-4 px-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-colors ${
                    simulateFailure 
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                  <span>{isOrdering ? "Processing..." : "Complete Checkout"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
