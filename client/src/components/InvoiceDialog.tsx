
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import { FormattedCurrency } from './FormattedCurrency';
import { Badge } from './ui/badge';

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export function InvoiceDialog({ open, setOpen, card }) {
  const [invoiceData, setInvoiceData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (open && card) {
      const fetchInvoice = async () => {
        setIsLoading(true);
        try {
          const response = await apiFetch(`/api/credit-cards/${card.id}/invoice`);
          if (!response.ok) {
            throw new Error('Failed to fetch invoice data');
          }
          const data = await response.json();
          setInvoiceData(data);
        } catch (error) {
          console.error(error);
          setInvoiceData(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [open, card]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fatura Aberta - {card?.name}</DialogTitle>
          {invoiceData && (
            <DialogDescription>
              Período de {formatDate(invoiceData.startDate)} a {formatDate(invoiceData.endDate)}.
              Vencimento em {formatDate(invoiceData.dueDate)}.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p>Carregando fatura...</p>
          ) : invoiceData && invoiceData.transactions.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell className="text-right">
                        <FormattedCurrency value={t.amount} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end items-center mt-4 pr-4">
                <span className="text-lg font-semibold">Total da Fatura:</span>
                <span className="text-lg font-bold text-red-400 ml-2">
                  <FormattedCurrency value={invoiceData.totalAmount} />
                </span>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação nesta fatura.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
