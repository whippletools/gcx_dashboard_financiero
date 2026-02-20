// components/tables/GuaranteeStatusTable.tsx
// US-005: Estatus de Garantías (Programadas/Naviera/Operación)
// Material Design 3 implementation with monthly breakdown

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { GuaranteeStatusData, GuaranteeStatus } from '@/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatters';
import { guaranteeStatusColors } from '@/lib/utils/colors';

interface GuaranteeStatusTableProps {
  data: GuaranteeStatusData;
  title?: string;
  className?: string;
}

export function GuaranteeStatusTable({
  data,
  title = 'Estatus de Garantías',
  className,
}: GuaranteeStatusTableProps) {
  const grandTotal = useMemo(
    () => data.summary.reduce((s, i) => s + i.amount, 0),
    [data.summary]
  );

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <CardTitle className="text-title-large text-on-surface">{title}</CardTitle>
        </div>
        <div className="text-right">
          <p className="text-label-medium text-on-surface-variant">Total Garantías</p>
          <p className="text-headline-small text-on-surface font-semibold">
            {formatCurrency(grandTotal)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-lg border border-outline-variant">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700">
                <th className="px-4 py-3 text-left text-label-medium font-semibold text-white">Estatus</th>
                <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">Monto</th>
                <th className="px-4 py-3 text-right text-label-medium font-semibold text-white">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant bg-surface">
              {data.summary.map((item) => (
                <tr key={item.status} className="hover:bg-surface-container transition-colors">
                  <td className="px-4 py-3 text-body-medium text-on-surface font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-sm"
                        style={{ backgroundColor: guaranteeStatusColors[item.status]?.border ?? '#888' }}
                      />
                      {item.status === 'Operacion' ? 'Operación' : item.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-body-medium text-on-surface font-mono">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-body-medium font-bold"
                    style={{ color: guaranteeStatusColors[item.status]?.border ?? '#888' }}
                  >
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
              {data.summary.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-body-medium text-on-surface-variant">
                    Sin datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
