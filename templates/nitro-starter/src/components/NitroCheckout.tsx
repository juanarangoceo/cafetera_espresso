'use client';

import { useState, useTransition } from 'react';
import { createOrder, type OrderResult } from '@/app/actions/order';

const fields = [
  ['fullName', 'Nombre completo', 'text', 'name'],
  ['email', 'Correo', 'email', 'email'],
  ['phone', 'Celular', 'tel', 'tel'],
  ['city', 'Ciudad', 'text', 'address-level2'],
  ['address', 'Dirección de entrega', 'text', 'street-address'],
] as const;

export function NitroCheckout({ enabled, demoMode = false }: { enabled: boolean; demoMode?: boolean }) {
  const [review, setReview] = useState<FormData | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (!enabled && !demoMode) {
    return <p className="notice">La compra en línea estará disponible cuando este sitio sea conectado a Nitro.</p>;
  }

  if (result?.success) {
    return (
      <div className="success" role="status">
        <h3>Pedido confirmado</h3>
        <p>Recibimos tu solicitud. Conserva el código {result.orderId}.</p>
      </div>
    );
  }

  if (review) {
    return (
      <div className="review">
        <h3>Revisa antes de confirmar</h3>
        <dl>
          {fields.map(([name, label]) => (
            <div key={name}>
              <dt>{label}</dt>
              <dd>{String(review.get(name) ?? '')}</dd>
            </div>
          ))}
        </dl>
        {demoMode ? <p className="demo-banner">Demostración: ningún pedido será enviado.</p> : null}
        {result?.message ? <p className="error" role="alert">{result.message}</p> : null}
        <div className="actions">
          <button type="button" className="secondary" onClick={() => setReview(null)}>Editar</button>
          <button
            type="button"
            disabled={pending || demoMode}
            onClick={() => {
              const confirmed = new FormData();
              review.forEach((value, key) => confirmed.set(key, value));
              confirmed.set('customerConfirmed', 'true');
              startTransition(async () => setResult(await createOrder(confirmed)));
            }}
          >
            {demoMode ? 'Envío deshabilitado en demo' : pending ? 'Confirmando…' : 'Confirmar pedido'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setResult(null);
        setReview(new FormData(event.currentTarget));
      }}
    >
      {demoMode ? <p className="demo-banner">Checkout demo · no crea pedidos reales</p> : null}
      {fields.map(([name, label, type, autoComplete]) => (
        <label key={name}>
          {label}
          <input name={name} type={type} autoComplete={autoComplete} required minLength={name === 'fullName' ? 3 : undefined} />
        </label>
      ))}
      <label className="consent">
        <input name="acceptedPrivacy" type="checkbox" required />
        <span>Autorizo el tratamiento de mis datos para gestionar este pedido.</span>
      </label>
      <button type="submit">Revisar pedido</button>
    </form>
  );
}
