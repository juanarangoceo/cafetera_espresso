import Client from 'shopify-buy';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'crrh5n-d8.myshopify.com';
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';

if (!storefrontAccessToken) {
    console.warn('Shopify Storefront Access Token is missing. Checkout will not work.');
}

const client = Client.buildClient({
  domain,
  storefrontAccessToken,
  apiVersion: '2024-01'
});

export const getFirstVariantId = async (productId: string) => {
    // Let errors bubble up to be caught by the UI
    const product = await client.product.fetch(productId);
    if (product && product.variants && product.variants.length > 0) {
        return product.variants[0].id;
    }
    throw new Error("Product found but has no variants or is unavailable");
};

export const createCheckout = async (variantId: string, quantity: number = 1) => {
  try {
    const lineItems = [
      {
        variantId: variantId,
        quantity: quantity,
      },
    ];

    // Atomic creation: Create checkout WITH items in one go
    // This prevents "empty checkout" scenarios and reduces API calls
    const checkout = await client.checkout.create({
        lineItems: lineItems
    });
    
    // Return the webUrl for redirection
    if (!checkout.webUrl) {
        throw new Error("Checkout created but no webUrl found.");
    }

    return checkout.webUrl;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

export default client;
