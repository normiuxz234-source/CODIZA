import { jsPDF } from 'jspdf';
import {
  DocumentRecord,
  CompanySettings,
  PdfCustomizationOptions,
} from '../types';

export const resolvePdfOptions = (
  companySettings: CompanySettings,
  document?: DocumentRecord,
  mode: 'cliente' | 'interno' = 'cliente',
  customOptions?: Partial<PdfCustomizationOptions>
): PdfCustomizationOptions => {
  const defaults: PdfCustomizationOptions = {
    mode,
    showLogo: true,
    showIssuerBusinessName: true,
    showIssuerTradeName: true,
    showIssuerTaxId: true,
    showIssuerAddress: true,
    showIssuerPhone: true,
    showIssuerEmail: true,
    showBankDetails: true,
    showFolio: true,
    showDates: true,
    showStatus: true,
    showClientName: true,
    showClientTaxId: true,
    showClientAddress: true,
    showClientPhone: true,
    showClientEmail: true,
    showDeliveryDetails: true,
    showItemDescriptions: true,
    showUnitPrices: true,
    showTaxes: true,
    showRetentions: true,
    showTotalInWords: true,
    showNotes: true,
    showTerms: true,
    showSignatures: true,
  };

  return {
    ...defaults,
    ...(companySettings.defaultPdfOptions || {}),
    ...(document?.pdfOptions || {}),
    ...(customOptions || {}),
    mode, // Force the requested mode
  };
};

export const generatePdfDocument = (
  document: DocumentRecord,
  companySettings: CompanySettings,
  mode: 'cliente' | 'interno' = 'cliente',
  customOptions?: Partial<PdfCustomizationOptions>
): jsPDF => {
  const isInternal = mode === 'interno';
  const options = resolvePdfOptions(companySettings, document, mode, customOptions);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = 215.9;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 187.9 mm
  let y = margin;

  // Document types metadata
  const typeTitles: Record<string, string> = {
    factura: 'FACTURA / CFDI DE VENTA',
    remision: 'NOTA DE REMISIÓN / ENTREGA',
    nota_venta: 'NOTA DE VENTA AL MOSTRADOR',
  };
  const docTitle = typeTitles[document.docType] || 'COMPROBANTE COMERCIAL';

  // Calculations for internal
  const totalCost = document.totalCost ?? document.items.reduce((acc, it) => acc + (it.quantity * (it.costPrice || it.unitPrice)), 0);
  const totalProfit = document.totalProfit ?? document.items.reduce((acc, it) => acc + (it.profit || (it.quantity * (it.unitPrice - (it.costPrice || it.unitPrice)))), 0);
  const avgMarkup = totalCost > 0 ? Math.round((totalProfit / totalCost) * 10000) / 100 : 0;

  // Top decorative header banner
  if (isInternal) {
    pdf.setFillColor(15, 23, 42); // slate 900 for internal
  } else if (document.docType === 'remision') {
    pdf.setFillColor(22, 101, 52); // emerald 800
  } else if (document.docType === 'nota_venta') {
    pdf.setFillColor(30, 41, 59); // slate 800
  } else {
    pdf.setFillColor(30, 41, 110); // indigo 900
  }
  pdf.rect(0, 0, pageWidth, 5, 'F');
  y += 4;

  // Internal Audit Stamp Banner if mode is internal
  if (isInternal) {
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text('DOCUMENTO DE CONTROL INTERNO Y COSTOS (CONFIDENCIAL / NO ENTREGAR AL CLIENTE)', margin + 3, y + 4.5);
    y += 9;
  }

  // Company Info Header (Left) and Folio Box (Right)
  const folioBoxWidth = 58;
  const folioBoxX = pageWidth - margin - folioBoxWidth;
  let leftHeaderStartX = margin;

  // 1. Render Logo if enabled
  if (options.showLogo) {
    let logoDrawn = false;
    if (companySettings.logoUrl) {
      try {
        pdf.addImage(companySettings.logoUrl, 'PNG', margin, y, 22, 18, undefined, 'FAST');
        leftHeaderStartX = margin + 26;
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }
    if (!logoDrawn) {
      pdf.setFillColor(30, 41, 110);
      pdf.roundedRect(margin, y, 18, 16, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      const initial = (companySettings.tradeName || companySettings.businessName || 'F').charAt(0).toUpperCase();
      pdf.text(initial, margin + 6.5, y + 11.5);
      leftHeaderStartX = margin + 22;
    }
  }

  // Calculate max text width for left header to ensure it NEVER touches the Folio Box
  const leftHeaderMaxWidth = (folioBoxX - 6) - leftHeaderStartX;
  let leftHeaderY = y;

  if (options.showIssuerBusinessName && companySettings.businessName) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(20, 30, 45);
    const bNameLines = pdf.splitTextToSize(companySettings.businessName, leftHeaderMaxWidth);
    pdf.text(bNameLines, leftHeaderStartX, leftHeaderY + 4);
    leftHeaderY += (bNameLines.length * 4.4) + 1;
  }

  if (options.showIssuerTradeName && companySettings.tradeName) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(67, 56, 202);
    const tNameLines = pdf.splitTextToSize(companySettings.tradeName, leftHeaderMaxWidth);
    pdf.text(tNameLines, leftHeaderStartX, leftHeaderY + 3);
    leftHeaderY += (tNameLines.length * 3.8);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 90, 100);

  if (options.showIssuerTaxId && companySettings.taxId) {
    const taxStr = `RFC: ${companySettings.taxId}${companySettings.taxRegime ? ' | ' + companySettings.taxRegime : ''}`;
    const taxLines = pdf.splitTextToSize(taxStr, leftHeaderMaxWidth);
    pdf.text(taxLines, leftHeaderStartX, leftHeaderY + 3);
    leftHeaderY += (taxLines.length * 3.4);
  }

  if (options.showIssuerAddress && (companySettings.street || companySettings.city || companySettings.address)) {
    const fullAddr = companySettings.address || `${companySettings.street || ''} ${companySettings.exteriorNumber || ''}, ${companySettings.neighborhood || ''}, ${companySettings.city || ''}, ${companySettings.state || ''} C.P. ${companySettings.postalCode || ''}`.trim();
    if (fullAddr) {
      const addrLines = pdf.splitTextToSize(fullAddr, leftHeaderMaxWidth);
      pdf.text(addrLines, leftHeaderStartX, leftHeaderY + 3);
      leftHeaderY += (addrLines.length * 3.4);
    }
  }

  if (options.showIssuerPhone || options.showIssuerEmail) {
    const contactStr = [
      options.showIssuerPhone && companySettings.phone ? `Tel: ${companySettings.phone}` : '',
      options.showIssuerEmail && companySettings.email ? `Email: ${companySettings.email}` : '',
    ]
      .filter(Boolean)
      .join('  |  ');
    if (contactStr) {
      const contactLines = pdf.splitTextToSize(contactStr, leftHeaderMaxWidth);
      pdf.text(contactLines, leftHeaderStartX, leftHeaderY + 3);
      leftHeaderY += (contactLines.length * 3.4);
    }
  }

  // Folio Box (Right Side)
  const folioBoxHeight = 22;
  if (options.showFolio || options.showStatus) {
    pdf.setFillColor(243, 246, 252);
    pdf.roundedRect(folioBoxX, y, folioBoxWidth, folioBoxHeight, 2, 2, 'F');

    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 110, 125);
    pdf.text(isInternal ? `${docTitle} (INTERNO)` : docTitle, folioBoxX + 4, y + 5);

    if (options.showFolio) {
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(isInternal ? 15 : 30, isInternal ? 23 : 41, isInternal ? 42 : 110);
      pdf.text(document.folio, folioBoxX + 4, y + 13);
    }

    if (options.showStatus) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(70, 80, 95);
      pdf.text(`ESTADO: ${document.status.toUpperCase()}`, folioBoxX + 4, y + 18.5);
    }
  }

  // Advance y cleanly past header elements
  y = Math.max(leftHeaderY, y + (options.showFolio || options.showStatus ? folioBoxHeight : 0), options.showLogo ? y + 20 : y) + 4;
  pdf.setDrawColor(220, 228, 236);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Client Box & Dates (Auto-wrapping & Dynamic Height calculation)
  const hasClientData = options.showClientName || options.showClientTaxId || options.showClientAddress || options.showClientPhone || options.showClientEmail;
  const hasDates = options.showDates;

  if (hasClientData || hasDates) {
    const clientColX = margin + 4;
    const clientColWidth = 114;
    const datesColX = pageWidth - margin - 58;

    // Measure Client column height dynamically
    let leftColH = 6;
    let cNameLines: string[] = [];
    if (options.showClientName) {
      cNameLines = pdf.splitTextToSize(document.clientName || 'CLIENTE GENERAL / PÚBLICO EN GENERAL', clientColWidth);
      leftColH += (cNameLines.length * 4) + 1;
    }

    let cTaxLines: string[] = [];
    if (options.showClientTaxId && document.clientTaxId) {
      cTaxLines = pdf.splitTextToSize(`RFC: ${document.clientTaxId}`, clientColWidth);
      leftColH += (cTaxLines.length * 3.4) + 0.5;
    }

    let cAddrLines: string[] = [];
    if (options.showClientAddress && document.clientAddress) {
      cAddrLines = pdf.splitTextToSize(`Dirección: ${document.clientAddress}`, clientColWidth);
      leftColH += (cAddrLines.length * 3.4) + 0.5;
    }

    let cContactLines: string[] = [];
    if ((options.showClientPhone && document.clientPhone) || (options.showClientEmail && document.clientEmail)) {
      const contactStr = [
        options.showClientPhone && document.clientPhone ? `Tel: ${document.clientPhone}` : '',
        options.showClientEmail && document.clientEmail ? `Email: ${document.clientEmail}` : '',
      ].filter(Boolean).join('  |  ');
      if (contactStr) {
        cContactLines = pdf.splitTextToSize(`Contacto: ${contactStr}`, clientColWidth);
        leftColH += (cContactLines.length * 3.4) + 0.5;
      }
    }

    // Measure Dates column height
    let rightColH = 6;
    if (hasDates) {
      rightColH += 4.5;
      if (document.dueDate) rightColH += 4;
      rightColH += 4;
    }

    const clientBoxHeight = Math.max(leftColH, rightColH, 20) + 3;

    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2, 'F');

    // Draw left side: Client details
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 110, 130);
    if (hasClientData) {
      pdf.text('DATOS DEL CLIENTE / RECEPTOR', clientColX, y + 4.5);
    }

    let currClientY = y + 9;
    if (options.showClientName && cNameLines.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(20, 25, 35);
      pdf.text(cNameLines, clientColX, currClientY);
      currClientY += (cNameLines.length * 4) + 1;
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(70, 80, 95);

    if (cTaxLines.length > 0) {
      pdf.text(cTaxLines, clientColX, currClientY);
      currClientY += (cTaxLines.length * 3.4) + 0.5;
    }

    if (cAddrLines.length > 0) {
      pdf.text(cAddrLines, clientColX, currClientY);
      currClientY += (cAddrLines.length * 3.4) + 0.5;
    }

    if (cContactLines.length > 0) {
      pdf.text(cContactLines, clientColX, currClientY);
    }

    // Draw right side: Dates & Currency
    if (hasDates) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 110, 130);
      pdf.text('FECHAS Y DETALLES', datesColX, y + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(70, 80, 95);
      pdf.text(`Fecha Emisión: ${document.issueDate}`, datesColX, y + 9);
      let dateY = y + 13;
      if (document.dueDate) {
        pdf.text(`Vencimiento: ${document.dueDate}`, datesColX, dateY);
        dateY += 4;
      }
      pdf.text(`Moneda: ${document.currency || 'MXN'}`, datesColX, dateY);
    }

    y += clientBoxHeight + 4;
  }

  // Delivery details if Remision and enabled
  if (options.showDeliveryDetails && document.docType === 'remision' && (document.driverName || document.vehiclePlates || document.deliveryAddress)) {
    const deliveryStr = `Chofer: ${document.driverName || 'N/A'}  |  Placas: ${document.vehiclePlates || 'N/A'}  |  Destino: ${document.deliveryAddress || 'En obra'}`;
    const deliveryLines = pdf.splitTextToSize(deliveryStr, contentWidth - 8);
    const delivBoxHeight = 8 + (deliveryLines.length * 3.4);

    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, y, contentWidth, delivBoxHeight, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(22, 101, 52);
    pdf.text('DATOS DE ENTREGA Y TRANSPORTE:', margin + 4, y + 4.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 50, 40);
    pdf.text(deliveryLines, margin + 4, y + 8.5);
    y += delivBoxHeight + 4;
  }

  // Items Table Header Helper
  const renderTableHeader = (currentY: number) => {
    pdf.setFillColor(isInternal ? 241 : 236, isInternal ? 245 : 241, isInternal ? 249 : 248);
    pdf.rect(margin, currentY, contentWidth, 6, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(50, 60, 75);

    if (!isInternal) {
      pdf.text('CANT.', margin + 2, currentY + 4);
      pdf.text('UNIDAD', margin + 14, currentY + 4);
      pdf.text('CONCEPTO / DESCRIPCIÓN', margin + 32, currentY + 4);
      if (options.showUnitPrices) {
        pdf.text('P. UNITARIO', pageWidth - margin - 32, currentY + 4, { align: 'right' });
      }
      pdf.text('IMPORTE', pageWidth - margin - 2, currentY + 4, { align: 'right' });
    } else {
      pdf.text('CANT.', margin + 2, currentY + 4);
      pdf.text('UNID.', margin + 12, currentY + 4);
      pdf.text('CONCEPTO', margin + 25, currentY + 4);
      pdf.text('COSTO U.', 122, currentY + 4, { align: 'right' });
      pdf.text('+% AUM.', 139, currentY + 4, { align: 'right' });
      pdf.text('P. VENTA', 159, currentY + 4, { align: 'right' });
      pdf.text('GANANCIA', 180, currentY + 4, { align: 'right' });
      pdf.text('IMPORTE', pageWidth - margin - 2, currentY + 4, { align: 'right' });
    }
  };

  renderTableHeader(y);
  y += 7;

  // Concept column width calculation
  const clientConceptMaxWidth = options.showUnitPrices ? (pageWidth - margin - 36) - (margin + 32) : (pageWidth - margin - 28) - (margin + 32);
  const internalConceptMaxWidth = 120 - (margin + 25); // ~81 mm

  // Items Rows
  document.items.forEach((item, index) => {
    const conceptWidth = !isInternal ? clientConceptMaxWidth : internalConceptMaxWidth;
    const nameLines = pdf.splitTextToSize(item.name, conceptWidth);
    let descLines: string[] = [];
    if (options.showItemDescriptions && item.description) {
      descLines = pdf.splitTextToSize(item.description, conceptWidth);
    }

    const textLinesCount = nameLines.length + descLines.length;
    const itemRowHeight = Math.max(5.5, (textLinesCount * 3.4) + 2.5);

    if (y + itemRowHeight > 245) {
      pdf.addPage();
      y = margin;
      renderTableHeader(y);
      y += 7;
    }

    const isAlt = index % 2 === 1;
    if (isAlt) {
      pdf.setFillColor(250, 252, 254);
      pdf.rect(margin, y - 1, contentWidth, itemRowHeight, 'F');
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 35, 45);

    if (!isInternal) {
      pdf.text(String(item.quantity), margin + 2, y + 3);
      pdf.text(item.unit || 'pza', margin + 14, y + 3);

      pdf.text(nameLines, margin + 32, y + 3);
      if (descLines.length > 0) {
        pdf.setFontSize(6.5);
        pdf.setTextColor(110, 120, 135);
        pdf.text(descLines, margin + 32, y + 3 + (nameLines.length * 3.3));
        pdf.setFontSize(7.5);
        pdf.setTextColor(30, 35, 45);
      }

      if (options.showUnitPrices) {
        pdf.text(`$${item.unitPrice.toFixed(2)}`, pageWidth - margin - 32, y + 3, { align: 'right' });
      }
      pdf.text(`$${item.subtotal.toFixed(2)}`, pageWidth - margin - 2, y + 3, { align: 'right' });
    } else {
      const cost = item.costPrice !== undefined ? item.costPrice : item.unitPrice;
      const markup = item.markupPercent !== undefined ? item.markupPercent : 0;
      const profit = item.profit !== undefined ? item.profit : Math.round(item.quantity * (item.unitPrice - cost) * 100) / 100;

      pdf.text(String(item.quantity), margin + 2, y + 3);
      pdf.text(item.unit || 'pza', margin + 12, y + 3);

      pdf.text(nameLines, margin + 25, y + 3);
      if (descLines.length > 0) {
        pdf.setFontSize(6.5);
        pdf.setTextColor(110, 120, 135);
        pdf.text(descLines, margin + 25, y + 3 + (nameLines.length * 3.3));
        pdf.setFontSize(7.5);
        pdf.setTextColor(30, 35, 45);
      }

      pdf.text(`$${cost.toFixed(2)}`, 122, y + 3, { align: 'right' });
      pdf.text(`+${markup}%`, 139, y + 3, { align: 'right' });
      pdf.text(`$${item.unitPrice.toFixed(2)}`, 159, y + 3, { align: 'right' });
      pdf.setTextColor(22, 101, 52); // Green for profit
      pdf.text(`+$${profit.toFixed(2)}`, 180, y + 3, { align: 'right' });
      pdf.setTextColor(30, 35, 45);
      pdf.text(`$${item.subtotal.toFixed(2)}`, pageWidth - margin - 2, y + 3, { align: 'right' });
    }

    y += itemRowHeight;
  });

  y += 2;
  pdf.setDrawColor(220, 228, 236);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Bottom Section: Left Notes/Bank & Right Totals
  if (y > 215) {
    pdf.addPage();
    y = margin + 4;
  }

  const startBottomY = y;
  let leftBottomY = y;

  if (options.showTotalInWords && document.totalInWords) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 110, 125);
    pdf.text('IMPORTE CON LETRA:', margin, leftBottomY + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(30, 40, 50);
    const wordsLines = pdf.splitTextToSize(document.totalInWords, 112);
    pdf.text(wordsLines, margin, leftBottomY + 6.5);
    leftBottomY += 7 + (wordsLines.length * 3.3);
  }

  // Bank Transfer box (optional)
  if (options.showBankDetails && companySettings.bankName && companySettings.bankClabe) {
    const bankBoxH = 17;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, leftBottomY, 112, bankBoxH, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(60, 70, 90);
    pdf.text(`DATOS PARA TRANSFERENCIA SPEI (${companySettings.bankName}):`, margin + 3, leftBottomY + 4.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`CLABE SPEI: ${companySettings.bankClabe}  |  Cuenta: ${companySettings.bankAccountNumber || companySettings.bankAccount || 'N/A'}`, margin + 3, leftBottomY + 8.5);
    pdf.text(`Titular: ${companySettings.bankAccountHolder || companySettings.bankBeneficiary || companySettings.businessName}`, margin + 3, leftBottomY + 12.5);
    leftBottomY += bankBoxH + 4;
  }

  // Internal Profit Metric Card in Internal Mode
  if (isInternal) {
    const profitBoxH = 15;
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, leftBottomY, 112, profitBoxH, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(22, 101, 52);
    pdf.text('BALANCE FINANCIERO INTERNO DEL COMPROBANTE:', margin + 3, leftBottomY + 4.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Costo Total: $${totalCost.toFixed(2)}  |  Ganancia Neta: +$${totalProfit.toFixed(2)}  (+${avgMarkup}%)`, margin + 3, leftBottomY + 9.5);
    leftBottomY += profitBoxH + 4;
  }

  // Notes
  if (options.showNotes && document.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(80, 90, 105);
    pdf.text('OBSERVACIONES:', margin, leftBottomY + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(50, 60, 75);
    const notesLines = pdf.splitTextToSize(document.notes, 112);
    pdf.text(notesLines, margin, leftBottomY + 6.5);
    leftBottomY += 7 + (notesLines.length * 3.2);
  }

  // Terms
  if (options.showTerms && document.terms) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(110, 120, 135);
    pdf.text('TÉRMINOS Y POLÍTICAS:', margin, leftBottomY + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(90, 100, 115);
    const termsLines = pdf.splitTextToSize(document.terms, 112);
    pdf.text(termsLines, margin, leftBottomY + 6.5);
    leftBottomY += 7 + (termsLines.length * 3);
  }

  // Totals Box (Right column)
  const rightColX = pageWidth - margin - 72;
  let rightY = startBottomY;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(70, 80, 95);

  pdf.text('Subtotal:', rightColX, rightY + 3.5);
  pdf.text(`$${document.subtotal.toFixed(2)}`, pageWidth - margin - 2, rightY + 3.5, { align: 'right' });
  rightY += 5;

  if (options.showTaxes) {
    pdf.text(`IVA (${Math.round((document.taxRate || 0.16) * 100)}%):`, rightColX, rightY + 3.5);
    pdf.text(`$${document.taxAmount.toFixed(2)}`, pageWidth - margin - 2, rightY + 3.5, { align: 'right' });
    rightY += 5;
  }

  if (options.showRetentions && document.retentionAmount > 0) {
    pdf.text('Retenciones:', rightColX, rightY + 3.5);
    pdf.text(`-$${document.retentionAmount.toFixed(2)}`, pageWidth - margin - 2, rightY + 3.5, { align: 'right' });
    rightY += 5;
  }

  rightY += 2;
  pdf.setFillColor(isInternal ? 241 : 240, isInternal ? 245 : 244, isInternal ? 249 : 250);
  pdf.roundedRect(rightColX - 2, rightY, 74, 9, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(20, 30, 80);
  pdf.text('TOTAL:', rightColX, rightY + 6);
  pdf.text(`$${document.total.toFixed(2)} ${document.currency || 'MXN'}`, pageWidth - margin - 2, rightY + 6, { align: 'right' });
  rightY += 14;

  // Signatures Box
  let bottomY = Math.max(leftBottomY, rightY);

  if (options.showSignatures) {
    let signY = bottomY + 12;
    if (signY + 18 > 265) {
      pdf.addPage();
      signY = margin + 18;
    }

    pdf.setDrawColor(180, 190, 205);
    pdf.line(margin + 10, signY, margin + 70, signY);
    pdf.line(pageWidth - margin - 70, signY, pageWidth - margin - 10, signY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 110, 125);
    pdf.text('RECIBIDO DE CONFORMIDAD', margin + 40, signY + 4, { align: 'center' });
    pdf.text('Nombre, Fecha y Firma de quien recibe', margin + 40, signY + 7, { align: 'center' });

    pdf.text('FIRMA AUTORIZADA / EMISIÓN', pageWidth - margin - 40, signY + 4, { align: 'center' });
    const signerName = companySettings.tradeName || companySettings.businessName || 'Emisor Autorizado';
    pdf.text(signerName, pageWidth - margin - 40, signY + 7, { align: 'center' });
  }

  // Footer on all pages
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(140, 150, 165);
    pdf.setDrawColor(230, 235, 240);
    pdf.line(margin, 271, pageWidth - margin, 271);
    pdf.text(`Comprobante emitido con FacturaYa  |  Folio: ${document.folio} ${isInternal ? '(Control Interno)' : ''}`, margin, 275.5);
    pdf.text(`Página ${i} de ${pageCount}`, pageWidth - margin, 275.5, { align: 'right' });
  }

  return pdf;
};

export const downloadPdfDocument = (
  document: DocumentRecord,
  companySettings: CompanySettings,
  mode: 'cliente' | 'interno' = 'cliente',
  customOptions?: Partial<PdfCustomizationOptions>
): void => {
  const pdf = generatePdfDocument(document, companySettings, mode, customOptions);
  const fileSuffix = mode === 'interno' ? '_INTERNO' : '_CLIENTE';
  pdf.save(`${document.folio || 'DOCUMENTO'}${fileSuffix}.pdf`);
};
