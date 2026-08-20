import { NextResponse, type NextRequest } from 'next/server';
import { getAdminIdentity } from '@/lib/admin-auth';
import { getSelectedSite } from '@/lib/admin-site';
import { createClient } from '@/utils/supabase/server';
import { ORDER_STATUS_META, formatOrderDateTime, isOrderStatus } from '@/lib/orders';

/**
 * Descarga de los pedidos de la tienda activa en CSV.
 *
 * Se consulta con la sesión de quien pide, **no** con la clave de servicio: así
 * es el RLS el que decide qué filas salen, y un cliente no puede descargar los
 * pedidos de otro ni cambiando el parámetro. Usar aquí la clave de servicio
 * convertiría este endpoint en la única puerta trasera de toda la plataforma.
 */

export const dynamic = 'force-dynamic';

/**
 * Excel interpreta un campo que empieza por `=`, `+`, `-` o `@` como fórmula.
 * Una dirección escrita por un comprador puede empezar por `-`, y un nombre
 * malicioso puede empezar por `=`: se antepone un apóstrofo para que la hoja lo
 * trate como texto.
 */
function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function sanitizeQuery(value: string) {
  return value.replace(/[,()%_\\*"']/g, ' ').trim().slice(0, 80);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminIdentity();
  if (!admin) {
    return NextResponse.json({ message: 'No autorizado.' }, { status: 401 });
  }

  const site = await getSelectedSite();
  if (!site) {
    return NextResponse.json({ message: 'No hay ninguna tienda activa.' }, { status: 400 });
  }

  const params = request.nextUrl.searchParams;
  const statusParam = params.get('estado');
  const activeStatus = isOrderStatus(statusParam) ? statusParam : null;
  const search = sanitizeQuery(params.get('q') ?? '');

  const supabase = await createClient();

  let query = supabase
    .from('orders_cod')
    .select('created_at, full_name, email, phone, city, address, total_price, status')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false })
    // Un tope explícito: sin él, una tienda con años de historial intentaría
    // materializar todo en memoria para armar el archivo.
    .limit(5000);

  if (activeStatus) query = query.eq('status', activeStatus);
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ No se pudo exportar los pedidos:', error);
    return NextResponse.json({ message: 'No se pudo generar el archivo.' }, { status: 500 });
  }

  const header = ['Fecha', 'Nombre', 'Correo', 'Celular', 'Ciudad', 'Dirección', 'Total', 'Estado'];

  const rows = (data ?? []).map((order) =>
    [
      formatOrderDateTime(order.created_at),
      order.full_name,
      order.email,
      order.phone,
      order.city,
      order.address,
      order.total_price,
      ORDER_STATUS_META[order.status as keyof typeof ORDER_STATUS_META]?.label ?? order.status,
    ]
      .map(csvCell)
      .join(','),
  );

  // BOM para que Excel en Windows reconozca UTF-8 y no destroce los acentos ni
  // la eñe, que en nombres y direcciones colombianas aparecen por todas partes.
  const csv = `﻿${[header.map(csvCell).join(','), ...rows].join('\r\n')}\r\n`;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `pedidos-${site.slug}-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
