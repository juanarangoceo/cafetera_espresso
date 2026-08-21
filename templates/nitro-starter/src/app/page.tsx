import { NitroCheckout } from '@/components/NitroCheckout';
import { formatPrice, PRODUCT } from '@/lib/product';
import { getSiteConfig } from '@/lib/site-config';

export default async function Home() {
  const site = await getSiteConfig();
  const orderEnabled = PRODUCT.commercialReady && site.isActive && Boolean(site.product);

  return (
    <main>
      {/* NITRO_STUDIO_SCAFFOLD: reemplaza esta composición con la dirección aprobada. */}
      <section className="hero">
        <p className="eyebrow">Starter creativo · no es una landing terminada</p>
        <h1>{PRODUCT.name}</h1>
        <p>{PRODUCT.shortPromise}</p>
        <strong>{formatPrice()}</strong>
      </section>
      <section className="brief">
        <h2>Diseña desde la evidencia del cliente</h2>
        <p>
          Esta interfaz es deliberadamente neutra. Lee los documentos, define una dirección propia
          y reemplaza por completo esta composición sin alterar el contrato seguro de Nitro.
        </p>
      </section>
      <section className="checkout" id="comprar">
        <div>
          <p className="eyebrow">Pedido contraentrega</p>
          <h2>Completa y confirma tus datos</h2>
          <p>El precio final lo resuelve Nitro desde el producto activo del cliente.</p>
        </div>
        <NitroCheckout enabled={orderEnabled} demoMode={PRODUCT.mode === 'demo'} />
      </section>
    </main>
  );
}
