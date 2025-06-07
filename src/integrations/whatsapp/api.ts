import axios from 'axios';

// Environment variables for WhatsApp API
// Use standardized naming for consistency with latest Wapanels API
// Note: In Vite, environment variables must be prefixed with VITE_ instead of REACT_APP_
const WAPANELS_API_KEY = import.meta.env.VITE_WAPANELS_API_KEY || import.meta.env.VITE_WAPANELS_APP_KEY || 'caa6aa7f-8086-4920-899d-4ac498a62eea';
const WAPANELS_AUTH_KEY = import.meta.env.VITE_WAPANELS_AUTH_KEY || 'dAUtf7zkmSDKTTZdAXb48oE29tB9NIWkldd3tr90ucGedWCPu3';
const DEVICE_KEY = import.meta.env.VITE_WAPANELS_DEVICE_KEY || ''; // Optional device key for newer APIs
const ADMIN_PHONE_NUMBERS = import.meta.env.VITE_ADMIN_PHONE_NUMBERS?.split(',') || ['0895385500396', '081394586882']; // Add default admin numbers

// API URLs - We'll try multiple endpoints in sequence until one works
const API_ENDPOINTS = [
  'https://app.wapanels.com/api/create-message',        // Primary endpoint
  
];

// Add a function to test API endpoints and update their health status
export const testWhatsAppEndpoints = async (): Promise<string> => {
  // Reset all endpoints to healthy first
  API_ENDPOINTS.forEach(endpoint => {
    endpointStatus[endpoint] = {
      healthy: true,
      lastChecked: Date.now()
    };
  });
  
  // Try a minimal test message to each endpoint
  let workingEndpoint = '';
  let successCount = 0;
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`Testing WhatsApp endpoint: ${endpoint}`);
      
      // Use a standard test payload
      const testPayload = {
        api_key: WAPANELS_API_KEY,
        auth_key: WAPANELS_AUTH_KEY,
        number: ADMIN_PHONE_NUMBERS[0].replace(/\D/g, ''),
        message: 'Test message from JPC Apps',
        type: 'text'
      };
      
      const response = await axios.post(
        endpoint,
        testPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 8000 // Short timeout for testing
        }
      );
      
      // Check for success in response
      if (response.status >= 200 && response.status < 300) {
        workingEndpoint = endpoint;
        successCount++;
        console.log(`✅ Endpoint ${endpoint} is working!`);
        break; // Found a working endpoint, stop testing
      }
    } catch (err) {
      console.log(`❌ Endpoint ${endpoint} failed test`);
      markEndpointUnhealthy(endpoint);
    }
  }
  
  return workingEndpoint || 'No working endpoints found';
};

// Endpoint health status cache to optimize future requests
const endpointStatus: {[key: string]: {healthy: boolean, lastChecked: number}} = {};

// Initialize all endpoints as potentially healthy
API_ENDPOINTS.forEach(endpoint => {
  endpointStatus[endpoint] = {
    healthy: true,
    lastChecked: 0
  };
});

// Get the most likely healthy endpoint
const getPreferredEndpoint = (): string => {
  // Default to first endpoint if no health info available
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000; // Reset endpoint status after an hour
  
  // Reset endpoints that were marked unhealthy over an hour ago
  Object.keys(endpointStatus).forEach(endpoint => {
    if (!endpointStatus[endpoint].healthy && 
        now - endpointStatus[endpoint].lastChecked > ONE_HOUR) {
      endpointStatus[endpoint].healthy = true;
    }
  });
  
  // Find first healthy endpoint
  const healthyEndpoint = API_ENDPOINTS.find(endpoint => 
    endpointStatus[endpoint].healthy
  );
  
  return healthyEndpoint || API_ENDPOINTS[0]; // Fallback to first endpoint if all marked unhealthy
};

// Mark an endpoint as unhealthy
const markEndpointUnhealthy = (endpoint: string): void => {
  if (endpointStatus[endpoint]) {
    endpointStatus[endpoint].healthy = false;
    endpointStatus[endpoint].lastChecked = Date.now();
    console.log(`Marked WhatsApp API endpoint as unhealthy: ${endpoint}`);
  }
};

// Mark an endpoint as healthy
const markEndpointHealthy = (endpoint: string): void => {
  if (endpointStatus[endpoint]) {
    endpointStatus[endpoint].healthy = true;
    endpointStatus[endpoint].lastChecked = Date.now();
  }
};

/**
 * Get admin phone numbers for notifications
 * @returns Array of admin phone numbers
 */
export const getAdminPhoneNumbers = (): string[] => {
  return ADMIN_PHONE_NUMBERS;
};

/**
 * Send WhatsApp message using the Wapanels API with intelligent endpoint selection
 * @param phoneNumber - Recipient phone number (with country code, no +)
 * @param message - Message content
 * @returns Promise with success status
 */
export const sendWatsapIdMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    // Validate required parameters
    if (!phoneNumber || !message) {
      console.error('WhatsApp API error: Missing required parameters (phone number or message)');
      return false;
    }

    // Validate message length
    if (message.length > 4096) {
      console.error('WhatsApp API error: Message too long, maximum length is 4096 characters');
      console.log(`Message length: ${message.length} characters, truncating to 4096`);
      message = message.substring(0, 4096);
    }

    // Improve phone number formatting
    // Step 1: Remove all non-digit characters
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    
    // Step 2: Apply specific country code logic for Indonesia
    // If starts with 0, replace with 62 (Indonesia country code)
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    }
    // If missing country code, add 62
    else if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
    }
    
    // Step 3: Validate minimum length (country code + at least 8 digits)
    if (formattedNumber.length < 10) {
      console.error(`WhatsApp API error: Phone number too short after formatting: ${formattedNumber}`);
      return false;
    }

    console.log(`Sending WhatsApp to formatted number: ${formattedNumber}`);

    // Try all available endpoints until one works
    for (const currentEndpoint of API_ENDPOINTS) {
      // Skip endpoints marked as unhealthy (unless all are unhealthy)
      if (!endpointStatus[currentEndpoint].healthy && 
          API_ENDPOINTS.some(endpoint => endpointStatus[endpoint].healthy)) {
        continue;
      }

      try {
        // Prepare proper payload based on endpoint
        let payload: Record<string, any>;
        // Define headers as a more flexible type to allow for different header configurations
        let headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Different endpoints require different payload formats based on their specific API
        if (currentEndpoint.includes('fonnte.com')) {
          // Fonnte API format
          headers = {
            'Authorization': WAPANELS_API_KEY,  // Uses Authorization header instead of body param
            'Content-Type': 'application/json'
          };
          
          payload = {
            target: formattedNumber,
            message: message,
            countryCode: '62',  // Indonesia
            delay: 0
          };
        } else if (currentEndpoint.includes('/create-message')) {
          // Wapanels create-message endpoint (updated format based on API validation errors)
          payload = {
            appkey: WAPANELS_API_KEY,       // API expects 'appkey' not 'api_key'
            authkey: WAPANELS_AUTH_KEY,     // API expects 'authkey'
            to: formattedNumber,            // API expects 'to' not 'number'
            message: message,               // API expects 'message' not 'text'
            template_id: '',                // API now requires template_id (even if empty)
            priority: 'high',
            repeat: 1                       // Number of attempts
          };
          
          // Alternative format to try if the above doesn't work
          if (DEVICE_KEY) {
            payload = {
              device_key: DEVICE_KEY,
              appkey: WAPANELS_API_KEY,
              authkey: WAPANELS_AUTH_KEY,
              to: formattedNumber,
              message: message,
              template_id: '',
              priority: 'high'
            };
          }
        } else if (currentEndpoint.includes('/send')) {
          // Generic /send endpoint format (updated parameters)
          payload = {
            appkey: WAPANELS_API_KEY,     // Changed from api_key to appkey
            authkey: WAPANELS_AUTH_KEY,   // Added authkey
            to: formattedNumber,          // Changed from number to to
            message: message,
            template_id: ''               // Added required template_id field
          };
        } else {
          // Standard API format (fallback with updated parameters)
          payload = {
            appkey: WAPANELS_API_KEY,     // Changed from api_key to appkey
            authkey: WAPANELS_AUTH_KEY,   // Changed from auth_key to authkey
            to: formattedNumber,          // Changed from phone to to
            message: message,
            template_id: '',              // Added required template_id field
            type: 'text'
          };
        }

        // Log which endpoint we're trying (without exposing full auth details)
        console.log(`Trying WhatsApp API endpoint: ${currentEndpoint.split('/').slice(-2).join('/')}`);

        // Detailed logging before making the request to aid debugging
        console.log(`WhatsApp API request to ${currentEndpoint.split('/').slice(-2).join('/')} with phone ${formattedNumber} (${message.length} chars)`);
        
        // Make the API request
        const response = await axios.post(
          currentEndpoint,
          payload,
          {
            headers,
            timeout: 15000 // 15 second timeout to prevent hanging
          }
        );

        // Check if response indicates success
        if (response.data && response.status >= 200 && response.status < 300) {
          console.log('WhatsApp API Response:', response.data);
          
          // New flexible success detection for various API response formats
          const isSuccess = (
            // Direct success indicators
            response.data.status === 'success' || 
            response.data.success === true || 
            response.data.error === false ||
            response.data.message_status === 'Success' ||
            response.data.status === 'sent' ||
            response.data.result === 'success' ||
            // Nested success indicators
            (response.data.data && (
              response.data.data.status === 'success' ||
              response.data.data.status_code === 200 ||
              response.data.data.result === 'success'
            )) ||
            // If no specific success indicator but got a 200 response with message ID
            (response.data.message_id || response.data.id || 
             (response.data.data && (response.data.data.message_id || response.data.data.id)))
          );
          
          // Check for specific validation errors
          const hasValidationError = (
            response.data.message === 'Validation errors' ||
            response.data.status === 'validation_error' ||
            (response.data.errors && Object.keys(response.data.errors).length > 0)
          );
          
          if (isSuccess) {
            // Mark this endpoint as healthy for future requests
            markEndpointHealthy(currentEndpoint);
            console.log(`✅ WhatsApp message sent successfully via ${currentEndpoint.split('/').slice(-2).join('/')}`);
            return true;
          }
          
          if (hasValidationError) {
            console.error('WhatsApp API validation error:', response.data);
            
            // Extract and log detailed validation error information
            if (response.data.errors) {
              console.error('Validation details:', JSON.stringify(response.data.errors));
            }
            
            if (response.data.data && response.data.data.message) {
              console.error('Error message:', response.data.data.message);
            }
            
            // For Wapanels/create-message, try again with different payload format if validation fails
            if (currentEndpoint.includes('/create-message')) {
              // Try alternate format for create-message endpoint
              try {
                console.log('Trying alternate payload format for create-message endpoint');
                
                const alternatePayload = {
                  appkey: WAPANELS_API_KEY,
                  authkey: WAPANELS_AUTH_KEY,
                  to: formattedNumber,
                  message: message
                };
                
                const alternateResponse = await axios.post(
                  currentEndpoint,
                  alternatePayload,
                  { headers, timeout: 15000 }
                );
                
                if (alternateResponse.data && alternateResponse.status >= 200 && alternateResponse.status < 300) {
                  if (alternateResponse.data.success === true) {
                    console.log(`✅ WhatsApp message sent successfully via alternate payload format`);
                    markEndpointHealthy(currentEndpoint);
                    return true;
                  }
                }
              } catch (altError) {
                console.error('Alternate payload also failed:', altError);
              }
            }
          }
        }
        
        // If we get here, the endpoint returned a 2xx status but with error content or validation issues
        console.warn(`WhatsApp API endpoint ${currentEndpoint} returned non-success data:`, response.data);
        
        // Check if this might be a temporary issue or a permanent one
        const isPermanentIssue = 
          response.data.message === 'Validation errors' || 
          response.data.error === 'invalid_key' || 
          response.data.status === 'error';
          
        if (isPermanentIssue) {
          console.error(`Marking endpoint ${currentEndpoint} as unhealthy due to validation/auth errors`);
          markEndpointUnhealthy(currentEndpoint);
        }
        // For other issues, we'll keep trying this endpoint in the future
      } 
      catch (error: any) {
        // Handle different types of errors
        if (error.response) {
          // HTTP error status codes
          const status = error.response.status;
          
          // Log detailed error info
          console.error(`WhatsApp API error (HTTP ${status}) with endpoint ${currentEndpoint}:`, {
            data: error.response.data,
            status: status
          });
          
          // Mark endpoint as unhealthy based on specific errors
          if (status === 404 || status === 401 || status === 403) {
            // 404 means endpoint doesn't exist
            console.error(`Endpoint ${currentEndpoint} not found (404). Marking as unhealthy.`);
            markEndpointUnhealthy(currentEndpoint);
          } 
          else if (status === 400) {
            // 400 could be validation errors with our request format
            console.error(`Validation error with endpoint ${currentEndpoint}. Will try other formats.`);
            markEndpointUnhealthy(currentEndpoint);
          }
          else if (status === 401 || status === 403) {
            // Authentication errors - might affect all endpoints
            console.error('WhatsApp API authentication failed. Check your API credentials.');
          }
        } 
        else if (error.request) {
          // Network error - could be temporary
          console.error(`Network error with endpoint ${currentEndpoint}:`, error.message);
        } 
        else {
          // Other errors
          console.error(`Error with endpoint ${currentEndpoint}:`, error.message);
        }
        
        // Continue to the next endpoint
      }
    }
    
    // If we've tried all endpoints and none worked
    console.error('All WhatsApp API endpoints failed. Message not sent.');
    return false;
  } 
  catch (error: any) {
    // Handle unexpected errors outside the main try/catch blocks
    console.error('Unexpected error in WhatsApp API service:', error.message);
    return false;
  }
};

/**
 * Format order details into a WhatsApp message that looks like a receipt
 */
export const formatOrderDetailsMessage = (
  order: {
    id: string;
    total: number;
    status: string;
    payment_method?: string;
    created_at?: string;
    shipping_cost?: number;
    subtotal?: number;
    discount_data?: any;
    [key: string]: any; // Allow for additional fields
  },
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    [key: string]: any; // Allow for additional fields
  },
  address: {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    district?: string;
    recipient_name?: string;
    recipient_phone?: string;
    [key: string]: any; // Allow for additional fields
  },
  items: Array<{
    product_name?: string;
    quantity?: number;
    price?: number;
    product_id?: string;
    variant?: string;
    unit?: string;
    [key: string]: any; // Allow for additional fields
  }>,
  shippingData?: {
    name?: string;
    cost?: number;
    provider?: string;
    service?: string;
    [key: string]: any; // Allow for additional fields
  },
  paymentMethodData?: {
    name?: string;
    bank_name?: string;
    account_number?: string;
    description?: string;
    [key: string]: any; // Allow for additional fields
  }
): string => {
  // Format date with more readable format
  const orderDate = order.created_at 
    ? new Date(order.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }) + ' pukul ' + new Date(order.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format item price per unit for receipt
  const formatUnitPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID').format(price);
  };
  
  // Get short order ID (last 8 characters)
  const shortOrderId = order.id.substring(0, 8);
  
  // Calculate shipping cost (we'll use a fixed value for now since subtotal may not be in the order object)
  // Ensure items array exists before attempting to use reduce
  const safeItems = Array.isArray(items) ? items : [];
  const calculatedSubtotal = safeItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  // Use order.shipping_cost if available, otherwise calculate from total - subtotal
  const shippingCost = order.shipping_cost || Math.max(0, order.total - calculatedSubtotal);
  
  // Format payment method
  const formatPaymentMethod = (method: string) => {
    if (method === 'bank-transfer') return 'Transfer Bank';
    if (method === 'cash-on-delivery') return 'Bayar di Tempat (COD)';
    if (method === 'e-wallet') return 'E-Wallet';
    if (method === 'qris') return 'QRIS';
    if (method === 'credit-card') return 'Kartu Kredit';
    return method;
  };
  
  // Get payment details
  const payment = paymentMethodData || {
    name: formatPaymentMethod(order.payment_method || 'Transfer Bank'),
    bank_name: 'SeaBank',
    account_number: '901958730549'
  };
  
  // Get shipping details - enhanced with more properties
  const shipping = {
    name: shippingData?.name || 'JPC Delivery',
    cost: shippingData?.cost || order.shipping_cost || 5000,
    provider: shippingData?.provider || order.shipping_provider || 'JPC',
    service: shippingData?.service || order.shipping_service || 'Regular',
    estimate: shippingData?.estimate || order.shipping_estimate || '2-3 hari',
    country: address?.country || 'Indonesia'
  };
  
  // Build struk-like message dengan format yang rapi tapi sederhana untuk menghindari validation errors
  let message = `*STRUK BELANJA - JPC*\n\n`;
  message += `*No. Pesanan:* #${shortOrderId}\n`;
  message += `*Tanggal:* ${orderDate}\n\n`;
  
  // Shipping address - use recipient name if available
  const recipientName = address.recipient_name || customer.name || 'N/A';
  const recipientPhone = address.recipient_phone || customer.phone || 'N/A';
  const district = address.district || '';
  
  message += `*INFORMASI PENGIRIMAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Nama Penerima: ${recipientName}\n`;
  message += `No. Telepon: ${recipientPhone}\n`;
  message += `Alamat: ${address.street || 'N/A'}\n`;
  message += `${district ? district + ', ' : ''}${address.city || 'N/A'}\n`;
  message += `${address.province || 'N/A'} ${address.postal_code || 'N/A'}\n`;
  message += `${shipping.country}\n\n`;
  
  message += `*METODE PENGIRIMAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Kurir: ${shipping.provider}\n`;
  message += `Layanan: ${shipping.service}\n`;
  message += `Ongkos Kirim: ${formatCurrency(shipping.cost)}\n`;
  message += `Estimasi: ${shipping.estimate}\n\n`;
  
  // Order items - ensure items array exists
  let subtotal = 0;
  
  message += `*DETAIL PESANAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  // Validate items array
  if (Array.isArray(safeItems) && safeItems.length > 0) {
    safeItems.forEach((item, index) => {
      const itemPrice = item.price || 0;
      const quantity = item.quantity || 0;
      const itemTotal = itemPrice * quantity;
      subtotal += itemTotal;
      
      message += `${index + 1}. *${item.product_name || 'Produk'}*${item.variant ? ' (' + item.variant + ')' : ''}\n`;
      message += `   ${quantity} ${item.unit || 'pcs'} × ${formatUnitPrice(itemPrice)}\n`;
      message += `   Subtotal: ${formatCurrency(itemTotal)}\n`;
      if (index < safeItems.length - 1) {
        message += `   -------------------------\n`;
      }
    });
  } else {
    // No items found
    message += `*Tidak ada item dalam pesanan ini*\n`;
  }
  
  message += `\n`;
  
  // Order summary dengan format yang rapi
  message += `*RINGKASAN PEMBAYARAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Subtotal Pesanan: ${formatCurrency(subtotal)}\n`;
  
  // Add discount if available
  if (order.discount_data) {
    const discount = order.discount_data;
    const discountValue = discount.type === 'percentage' 
      ? `${discount.value}%` 
      : formatCurrency(discount.value);
    message += `Diskon${discount.code ? ' (' + discount.code + ')' : ''}: -${discountValue}\n`;
  }
  
  // Shipping information with provider name
  message += `Biaya Pengiriman (${shipping.provider || 'JPC'} ${shipping.service || 'Regular'}): ${formatCurrency(shipping.cost || shippingCost)}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `*TOTAL PEMBAYARAN: ${formatCurrency(order.total)}*\n\n`;
  
  // Payment information with bank details
  message += `*INFORMASI PEMBAYARAN*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Metode Pembayaran: ${payment.name || formatPaymentMethod(order.payment_method || 'N/A')}\n`;
  
  if (payment.bank_name && payment.account_number) {
    message += `\n*Detail Pembayaran:*\n`;
    message += `Bank: ${payment.bank_name}\n`;
    message += `No. Rekening: ${payment.account_number}\n`;
    message += `a.n. Jaya Perkasa Charcoal\n`;
  } else if (order.payment_method === 'bank-transfer' || order.payment_method?.includes('transfer')) {
    message += `\n*Detail Pembayaran:*\n`;
    message += `Bank: SeaBank\n`;
    message += `No. Rekening: 901958730549\n`;
    message += `a.n. Jaya Perkasa Charcoal\n`;
  } else if (order.payment_method === 'cash-on-delivery' || order.payment_method?.includes('cod')) {
    message += `\nPembayaran dilakukan saat barang diterima.\n`;
  }
  
  message += `\n*REFERENSI PEMBAYARAN*\n`;
  message += `#${shortOrderId}\n\n`;
  
  message += `*CATATAN PENTING*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `• Segera lakukan pembayaran agar pengiriman dapat diproses\n`;
  message += `• Sertakan nomor pesanan saat melakukan pembayaran\n`;
  message += `• Kirimkan bukti pembayaran kepada admin\n\n`;
  
  message += `*Layanan Pelanggan:*\n`;
  message += `Telp/WA: 0813-9458-6882\n\n`;
  
  message += `Terima kasih telah berbelanja di\n*JAYA PERKASA CHARCOAL*`;
  
  return message;
};

/**
 * Helper function for currency formatting
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Import enhanced notification formatter
import { formatEnhancedOrderNotification, formatSimplifiedOrderNotification } from './order-notification-enhanced';

/**
 * Send order notification to customer
 */
export const sendOrderNotificationToCustomer = async (
  order: any,
  customer: any,
  address: any,
  items: any[],
  shippingData?: any,
  paymentMethodData?: any
): Promise<boolean> => {
  try {
    if (!customer?.phone) {
      console.error('Cannot send WhatsApp notification: Customer phone number missing');
      return false;
    }
    
    console.log('⏱️ Starting WhatsApp notifications with complete order data');
    
    // Debugging data yang diterima
    console.log('Order:', { id: order?.id, total: order?.total, status: order?.status });
    console.log('Items received:', items);
    console.log('Address received:', address);
    
    // CRITICAL: Validasi dan normalisasi data item pesanan
    let safeItems = [];
    if (Array.isArray(items) && items.length > 0) {
      safeItems = items.map(item => ({
        product_name: item.product_name || 'Produk',
        price: item.price || 0,
        quantity: item.quantity || 1,
        variant: item.variant || '',
        unit: item.unit || '',
        product_id: item.product_id || ''
      }));
      console.log(`✅ Order items valid: ${safeItems.length} items found`);
    } else {
      console.warn('⚠️ No valid order items found, creating dummy item for notification');
      // Buat item dummy jika tidak ada item tersedia agar notifikasi tetap informatif
      safeItems = [{
        product_name: 'Pesanan Anda',
        price: order.total || 0,
        quantity: 1,
        variant: '',
        unit: '',
        product_id: ''
      }];
    }
    
    // Tampilkan item pertama untuk debugging
    if (safeItems.length > 0) {
      console.log('First item sample:', {
        name: safeItems[0].product_name,
        price: safeItems[0].price,
        qty: safeItems[0].quantity
      });
    }
    
    // Validasi data alamat untuk memastikan nilai tidak kosong
    const safeAddress = {
      street: address?.street || 'Alamat tidak tersedia',
      district: address?.district || '',
      city: address?.city || 'Kota tidak tersedia',
      province: address?.province || 'Provinsi tidak tersedia',
      postal_code: address?.postal_code || '',
      notes: address?.notes || '',
      recipient_name: address?.recipient_name || customer?.name || 'Pelanggan',
      recipient_phone: address?.recipient_phone || customer?.phone || ''
    };
    
    console.log('Normalized address data:', {
      street: safeAddress.street.substring(0, 15) + '...',
      district: safeAddress.district,
      city: safeAddress.city,
      province: safeAddress.province
    });
    
    // Validasi data shipping
    const safeShippingData = shippingData || {
      provider: order.shipping_provider || 'JPC Delivery',
      service: order.shipping_service || 'Reguler',
      cost: order.shipping_cost || 0,
      estimate: order.shipping_estimate || '1-3 Hari'
    };
    
    // Validasi data payment
    const safePaymentData = paymentMethodData || {
      name: 'Transfer Bank',
      bank_name: 'SeaBank',
      account_number: '901958730549',
      account_name: 'Jaya Perkasa Charcoal'
    };
    
    // Gunakan formatter baru untuk pesan yang lebih terstruktur dan informatif
    console.log('Membuat pesan terformat dengan detail lengkap...');
    let messageToSend = '';
    
    // Buat pesan dengan detail lengkap namun tetap di bawah batas karakter
    // Format WhatsApp memiliki batas maksimal 1000 karakter
    const verySimpleMessage = formatSimplifiedOrderNotification(
      order,
      customer,
      safePaymentData,
      safeAddress,
      safeItems,
      safeShippingData
    );
    
    // Log pesan untuk debugging
    console.log(`Pesan ringkas dibuat: ${verySimpleMessage.length} karakter`);
    console.log('Detail items dalam pesan:', safeItems.map(item => `${item.product_name} (${item.quantity}x)`));
    
    // Pastikan pesan yang akan dikirim tidak melebihi batas 1000 karakter
    console.log(`Panjang pesan ringkas: ${verySimpleMessage.length} karakter`);
    
    if (verySimpleMessage.length > 1000) {
      console.error(`Bahkan pesan ringkas masih terlalu panjang (${verySimpleMessage.length} karakter)`);
      // Buat pesan darurat yang sangat pendek tapi tetap informatif
      const statusText = order.status === 'pending' ? 'Menunggu Pembayaran' : 
                         order.status === 'processing' ? 'Diproses' :
                         order.status === 'shipped' ? 'Dikirim' :
                         order.status === 'completed' ? 'Selesai' :
                         order.status || 'Menunggu';
      
      // Tampilkan minimal 1 item pesanan
      let itemInfo = 'Produk tidak tersedia';
      if (Array.isArray(safeItems) && safeItems.length > 0) {
        const item = safeItems[0];
        itemInfo = `${item.product_name || 'Produk'} (${item.quantity || 1}x)`;
        if (safeItems.length > 1) {
          itemInfo += ` +${safeItems.length-1} item lainnya`;
        }
      }
      
      // Buat string untuk semua item pesanan (maksimal 3 item)
      let productsList = '';
      if (Array.isArray(safeItems) && safeItems.length > 0) {
        const maxItemsToShow = Math.min(safeItems.length, 3);
        for (let i = 0; i < maxItemsToShow; i++) {
          const item = safeItems[i];
          productsList += `${i+1}. ${item.product_name || 'Produk'} (${item.quantity || 1}x) - ${formatCurrency(item.price || 0)}\n`;
        }
        
        // Tambahkan keterangan jika ada item lain yang tidak ditampilkan
        if (safeItems.length > maxItemsToShow) {
          productsList += `+${safeItems.length - maxItemsToShow} item lainnya\n`;
        }
      } else {
        productsList = 'Produk tidak tersedia\n';
      }
      
      // Pesan darurat dengan informasi vital: ID, status, item, total, pengiriman
      messageToSend = `🎉 *PESANAN BERHASIL* 🎉\n\n` +
        `Halo ${customer?.name || 'Pelanggan'}!\n\n` +
        `*DETAIL PESANAN*\n` +
        `ID: #${order.id.substring(0, 8)}\n` +
        `Status: ${statusText}\n\n` +
        
        `*PRODUK YANG DIPESAN*\n` +
        `${productsList}\n` +
        
        `*PENGIRIMAN*\n` +
        `Kurir: ${safeShippingData.provider || 'JPC Delivery'}\n` +
        `Layanan: ${safeShippingData.service || 'Reguler'}\n` +
        `Ongkos Kirim: ${formatCurrency(safeShippingData.cost || 0)}\n` +
        `Estimasi: ${safeShippingData.estimate || '1-3 Hari'}\n\n` +
        
        `*PEMBAYARAN*\n` +
        `Total: ${formatCurrency(order.total)}\n\n` +
        
        `*HUBUNGI*: 0813-9458-6882\n` +
        `*JAYA PERKASA CHARCOAL*`;
        
      console.log(`Panjang pesan darurat: ${messageToSend.length} karakter`);
    } else {
      messageToSend = verySimpleMessage;
    }
    
    // Debug pesan yang akan dikirim
    console.log(`Pesan final: ${messageToSend.length} karakter`);
    console.log('Konten pesan WhatsApp (awal):', messageToSend.substring(0, 100) + '...');
    
    // Send message to customer
    console.log('Mengirim pesan WhatsApp ke:', customer.phone);
    const sent = await sendWatsapIdMessage(customer.phone, messageToSend);
    
    if (sent) {
      console.log('✅ WhatsApp notification berhasil dikirim ke pelanggan');
    } else {
      console.log('❌ Gagal mengirim WhatsApp notification ke pelanggan');
    }
    
    return sent;
  } catch (error) {
    console.error('Error sending customer order notification:', error);
    return false;
  }
};

/**
 * Send order notification to all admin numbers
 */
export const sendOrderNotificationToAllAdmins = async (
  order: any,
  customer: any,
  address: any,
  items: any[],
  shippingData?: any,
  paymentMethodData?: any
): Promise<boolean> => {
  console.log('Sending WhatsApp notification to admin with shipping cost:', order?.shipping_cost);
  try {
    // Format date with more readable format
    const orderDate = order.created_at 
      ? new Date(order.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + ' pukul ' + new Date(order.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) + ' pukul ' + new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        });

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount).replace('Rp\u00a0', 'Rp '); // Replace non-breaking space with regular space
    };
    
    // Calculate subtotal
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 0));
    }, 0);
    
    // Generate items text
    const itemsText = safeItems.map((item, index) => {
      const price = item.price || 0;
      const quantity = item.quantity || 1;
      const total = price * quantity;
      return `${index+1}. ${item.product_name || 'Produk'} (${quantity}x) - ${formatCurrency(total)}`;
    }).join('\n');
    
    // Extract shipping data for display dan pastikan ongkos kirim muncul
    const shipping = shippingData || {
      provider: order.shipping_provider || 'JPC Delivery',
      service: order.shipping_service || 'Reguler',
      estimate: order.shipping_estimate || '1-3 Jam',
      cost: order.shipping_cost || 0
    };
    
    // Pastikan ongkos kirim ada dan muncul
    const shippingCost = order.shipping_cost || shipping.cost || 0;
    console.log('Admin notification - shipping cost:', shippingCost);
    
    // Extract discount data if available
    const discountData = order.discount_data || {};
    const hasDiscount = discountData && (discountData.value > 0 || discountData.code);
    
    // Format discount value if present
    const discountValue = hasDiscount ? (
      discountData.type === 'percentage' 
        ? `${discountData.value}%` 
        : formatCurrency(discountData.value || 0)
    ) : '0';
    
    // Format recipient details
    const recipientName = address?.recipient_name || customer?.name || 'N/A';
    const recipientPhone = address?.recipient_phone || customer?.phone || 'N/A';
    
    // Generate structured message that matches the requested format with enhanced details
    const adminMessage = `🛒 PESANAN BARU 🛒\n\n`+
      `ID Pesanan: #${order.id}\n`+
      `Tanggal: ${orderDate}\n`+
      `Status: ${order.status || 'pending'}\n\n`+
      
      `DATA PELANGGAN\n`+
      `Nama: ${customer?.name || 'Pelanggan'}\n`+
      `No. HP: ${customer?.phone || 'N/A'}\n`+
      `Email: ${customer?.email || 'N/A'}\n\n`+
      
      `DETAIL PENERIMA\n`+
      `Nama Penerima: ${recipientName}\n`+
      `No. HP Penerima: ${recipientPhone}\n\n`+
      
      `ALAMAT PENGIRIMAN\n`+
      `${address?.street || 'N/A'}\n`+
      `${address?.district ? address.district + ', ' : ''}${address?.city || 'N/A'}\n`+
      `${address?.province || 'N/A'} ${address?.postal_code || ''}\n`+
      `Catatan: ${address?.notes || '-'}\n\n`+
      
      `INFORMASI PENGIRIMAN\n`+
      `Kurir: ${shipping.provider || order.shipping_provider || 'JPC Delivery'}\n`+
      `Layanan: ${shipping.service || order.shipping_service || 'Reguler'}\n`+
      `Ongkos Kirim: ${formatCurrency(shippingCost)}\n`+
      `Estimasi: ${shipping.estimate || order.shipping_estimate || '1-3 Jam'}\n`+
      `Detail Alamat: ${address?.country || ''}\n\n`+
      
      `DETAIL PESANAN\n`+
      `${itemsText}\n\n`+
      
      `RINGKASAN PEMBAYARAN\n`+
      `Subtotal Produk: ${formatCurrency(subtotal)}\n`+
      `${hasDiscount ? `Diskon${discountData.code ? ' (' + discountData.code + ')' : ''}: -${discountValue}\n` : ''}`+
      `Ongkos Kirim: ${formatCurrency(shippingCost)}\n`+
      `Total Pembayaran: ${formatCurrency(order.total)}\n\n`+
      
      `INFORMASI PEMBAYARAN\n`+
      `Metode: ${formatPaymentMethod(order.payment_method || 'N/A')}\n`+
      `Status Pembayaran: ${order.payment_status || 'Belum dibayar'}\n`+
      `${order.payment_method === 'bank-transfer' ? 
        `Bank: ${paymentMethodData?.bank_name || 'SeaBank'}\n`+
        `No. Rekening: ${paymentMethodData?.account_number || '901958730549'}\n`+
        `a.n: ${paymentMethodData?.account_name || 'Jaya Perkasa Charcoal'}\n` : ''}\n`+
      
      `Terima kasih telah berbelanja di JPC!\n`+
      `Untuk informasi lebih lanjut, silakan hubungi kami.\n\n`+
      
      `PERHATIAN: Pesanan baru memerlukan persetujuan Anda. Silakan buka dashboard admin untuk memprosesnya.`;
    
    // Track successful sends
    let successCount = 0;
    
    // Send sequentially to avoid rate limiting
    for (const adminPhone of ADMIN_PHONE_NUMBERS) {
      try {
        // Add a small delay between messages to avoid rate limiting
        if (successCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
        
        const success = await sendWatsapIdMessage(adminPhone, adminMessage);
        if (success) {
          successCount++;
          console.log(`✅ WhatsApp notification sent to admin: ${adminPhone}`);
        }
      } catch (err) {
        console.error(`Error sending WhatsApp to admin ${adminPhone}:`, err);
        // Continue with other admins even if one fails
      }
    }
    
    // If at least one was successful, consider it a success
    return successCount > 0;
  } catch (error) {
    console.error('Error sending admin notifications:', error);
    return false;
  }
};

// Format payment method helper function
const formatPaymentMethod = (method: string): string => {
  if (method === 'bank-transfer') return 'Transfer Bank';
  if (method === 'cash-on-delivery') return 'Bayar di Tempat (COD)';
  if (method === 'e-wallet') return 'E-Wallet';
  if (method === 'qris') return 'QRIS';
  if (method === 'credit-card') return 'Kartu Kredit';
  return method;
};

/**
 * Alias for sendWatsapIdMessage - for backward compatibility
 * @param phoneNumber - Recipient phone number (with country code, no +)
 * @param message - Message content
 * @returns Promise with success status
 */
export const sendWhatsAppMessage = sendWatsapIdMessage;
