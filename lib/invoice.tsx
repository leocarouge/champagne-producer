import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Order } from '@/types'

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.woff2' },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 50,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#C9A84C',
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 9,
    color: '#C9A84C',
    marginTop: 4,
    letterSpacing: 1,
  },
  invoiceLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C9A84C',
    textAlign: 'right',
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  sectionBlock: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#C9A84C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 10,
    color: '#333',
    lineHeight: 1.5,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 8,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colProduct: { flex: 3, color: '#fff', fontSize: 9, fontWeight: 'bold' },
  colQty: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 9, fontWeight: 'bold' },
  colPrice: { flex: 1, textAlign: 'right', color: '#fff', fontSize: 9, fontWeight: 'bold' },
  colTotal: { flex: 1, textAlign: 'right', color: '#fff', fontSize: 9, fontWeight: 'bold' },
  cellProduct: { flex: 3, fontSize: 10, color: '#333' },
  cellQty: { flex: 1, textAlign: 'center', fontSize: 10, color: '#333' },
  cellPrice: { flex: 1, textAlign: 'right', fontSize: 10, color: '#333' },
  cellTotal: { flex: 1, textAlign: 'right', fontSize: 10, color: '#333' },
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 220,
    marginBottom: 4,
  },
  totalsLabel: {
    flex: 1,
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    paddingRight: 12,
  },
  totalsValue: {
    width: 80,
    fontSize: 10,
    color: '#333',
    textAlign: 'right',
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 220,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#C9A84C',
  },
  totalFinalLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'right',
    paddingRight: 12,
  },
  totalFinalValue: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C9A84C',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
})

interface InvoiceDocProps {
  order: Order
  invoiceNumber: string
}

function InvoiceDocument({ order, invoiceNumber }: InvoiceDocProps) {
  const address = order.shipping_address
  const issuedDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>CAROUGE-CIREDDU</Text>
            <Text style={styles.brandTagline}>CHAMPAGNE — FLAVIGNY (MARNE)</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>N° {invoiceNumber}</Text>
            <Text style={styles.invoiceNumber}>Date : {issuedDate}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Expéditeur</Text>
            <Text style={styles.sectionText}>Champagne Carouge-Cireddu</Text>
            <Text style={styles.sectionText}>6 Rue de l'Église</Text>
            <Text style={styles.sectionText}>Flavigny, 51190, France</Text>
            <Text style={styles.sectionText}>champagnecarougecireddu@gmail.com</Text>
            <Text style={styles.sectionText}>SIRET : à compléter</Text>
          </View>
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Destinataire</Text>
            <Text style={styles.sectionText}>{order.customer_name}</Text>
            <Text style={styles.sectionText}>{address.line1}</Text>
            {address.line2 && <Text style={styles.sectionText}>{address.line2}</Text>}
            <Text style={styles.sectionText}>{address.postal_code} {address.city}</Text>
            <Text style={styles.sectionText}>{address.country}</Text>
            <Text style={styles.sectionText}>{order.customer_email}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProduct}>Produit</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {order.order_items?.map((item, i) => (
            <View key={item.id} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.cellProduct}>{item.product_name}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>{Number(item.unit_price).toFixed(2)} €</Text>
              <Text style={styles.cellTotal}>{Number(item.total_price).toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Sous-total</Text>
            <Text style={styles.totalsValue}>{Number(order.subtotal).toFixed(2)} €</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Frais de livraison</Text>
            <Text style={styles.totalsValue}>{Number(order.shipping_cost).toFixed(2)} €</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>TVA (20%)</Text>
            <Text style={styles.totalsValue}>Incluse</Text>
          </View>
          <View style={styles.totalFinalRow}>
            <Text style={styles.totalFinalLabel}>TOTAL TTC</Text>
            <Text style={styles.totalFinalValue}>{Number(order.total).toFixed(2)} €</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Champagne Carouge-Cireddu — 6 Rue de l'Église, Flavigny 51190 — champagnecarougecireddu@gmail.com</Text>
          <Text style={styles.footerText}>Paiement effectué le {issuedDate}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generateInvoicePDF(order: Order, invoiceNumber: string): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <InvoiceDocument order={order} invoiceNumber={invoiceNumber} />
  )
  return buffer
}

export function generateInvoiceNumber(orderId: string): string {
  const year = new Date().getFullYear()
  const shortId = orderId.replace(/-/g, '').substring(0, 8).toUpperCase()
  return `ML-${year}-${shortId}`
}
