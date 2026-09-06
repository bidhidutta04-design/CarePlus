"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KpiCard } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCollectPayment, useInvoices } from "@/hooks/useBilling";
import { useAppSelector } from "@/store/hooks";
import { Wallet, HandCoins, Hourglass } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function BillingDeskPage() {
  const userName = useAppSelector((s) => s.auth.userName);
  const { data, isLoading } = useInvoices();
  const collect = useCollectPayment();
  const invoices = data?.data ?? [];
  const open = invoices.filter((i) => i.status !== "Paid");
  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const collected = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const tpa = open.filter((i) => i.paymentMethod === "TPA Insurance").length;

  return (
    <div>
      <PageHeader
        title={`Billing desk — ${userName}`}
        subtitle="Collections, balances, and TPA claims"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/billing">All invoices</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Wallet} label="Billed" value={formatINR(billed)} sub={`${invoices.length} invoices`} tone="blue" />
        <KpiCard icon={HandCoins} label="Collected" value={formatINR(collected)} sub="cash + card + UPI + TPA" tone="green" />
        <KpiCard icon={Hourglass} label="Open (incl. TPA)" value={String(open.length)} sub={`${tpa} TPA claims pending`} tone="amber" />
      </div>
      <Card className="mt-4 rounded-2xl shadow-card">
        <CardHeader>
          <CardTitle>{isLoading ? "Loading…" : `Open balances (${open.length})`}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-semibold">{i.id}</TableCell>
                  <TableCell>{i.patientName}</TableCell>
                  <TableCell>{formatINR(i.totalAmount)}</TableCell>
                  <TableCell className="font-semibold text-red-600">{formatINR(i.balanceDue)}</TableCell>
                  <TableCell className="text-xs">
                    {i.paymentMethod}
                    {i.tpaProvider ? ` • ${i.tpaProvider}` : ""}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={collect.isPending}
                      onClick={() => collect.mutate({ id: i.id, amount: i.balanceDue })}
                    >
                      Collect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {open.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nothing outstanding.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
