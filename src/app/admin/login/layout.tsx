import type { Metadata } from 'next';

/**
 * La página de acceso es un componente cliente y no puede exportar `metadata`.
 * Además queda fuera del grupo `(panel)`, así que tampoco hereda la suya: sin
 * este layout sería la única ruta del panel indexable.
 */
export const metadata: Metadata = {
  title: 'Acceso | Nitro Landing',
  // La descripción se sobrescribe a propósito: sin esto se hereda la del layout
  // raíz, que es el texto comercial de una de las tiendas gestionadas. El panel
  // lo usan varios clientes y ninguno tiene por qué encontrarse la marca de
  // otro en su propia pantalla.
  description: 'Panel de operación de Nitro Landing.',
  robots: { index: false, follow: false },
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
