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
    try {
        const product = await client.product.fetch(productId);
        if (product && product.variants && product.variants.length > 0) {
            return product.variants[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

export const createCheckout = async (variantId: string, quantity: number = 1) => {
  try {
    const checkout = await client.checkout.create();
    const lineItemsToAdd = [
      {
        variantId: variantId,
        quantity: quantity,
      },
    ];
    
    // Add an item to the checkout
    const checkoutWithItem = await client.checkout.addLineItems(checkout.id, lineItemsToAdd);
    
    // Return the webUrl for redirection
    return checkoutWithItem.webUrl;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

export default client;
