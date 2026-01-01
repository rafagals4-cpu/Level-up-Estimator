
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Estimate, Client, Product, CompanyProfile } from '../types';

export const generateEstimatePDF = (
  estimate: Estimate, 
  client: Client, 
  products: Product[], 
  companyProfile: CompanyProfile
): jsPDF => {
  const doc = new jsPDF();
  
  // Theme Configuration
  const isDark = companyProfile.pdfTheme === 'dark';

  const colors = isDark ? {
    bg: "#121212",
    card: "#1e1e1e",
    textPrimary: "#ffffff",
    textSecondary: "#a0a0a0",
    accent: "#8CFF00",
    divider: "#8CFF00",
    tableHeaderBg: "#8CFF00",
    tableHeaderText: "#000000",
    tableBodyBg: "#121212",
    tableBodyText: "#ffffff",
    tableLine: "#333333"
  } : {
    bg: "#ffffff",
    card: "#f8fafc",
    textPrimary: "#0f172a", // Slate 900
    textSecondary: "#64748b", // Slate 500
    accent: "#000000", // Black for strong contrast in light mode
    divider: "#e2e8f0", // Slate 200
    tableHeaderBg: "#0f172a", // Slate 900
    tableHeaderText: "#ffffff",
    tableBodyBg: "#ffffff",
    tableBodyText: "#0f172a",
    tableLine: "#e2e8f0"
  };

  // 1. Fill Background
  doc.setFillColor(colors.bg);
  doc.rect(0, 0, 210, 297, "F");

  // --- Header ---
  
  let currentY = 20;

  // Render Logo if exists
  if (companyProfile.logoUrl) {
    try {
      // Add Image at top left (x=20, y=15), size 25x25mm (square assumption)
      doc.addImage(companyProfile.logoUrl, 'JPEG', 20, 15, 25, 25);
      // Move text down to accommodate logo
      currentY = 48; 
    } catch (e) {
      console.warn("Could not render logo to PDF", e);
    }
  }

  doc.setTextColor(colors.accent);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  
  // Handle long company names
  const companyName = companyProfile.name.toUpperCase();
  const splitName = doc.splitTextToSize(companyName, 120);
  doc.text(splitName, 20, currentY);
  
  // Website below the name
  const nameHeight = splitName.length * 8; 
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(companyProfile.website, 20, currentY + nameHeight);

  // ESTIMATE Title
  doc.setTextColor(colors.textPrimary);
  doc.setFontSize(36); 
  doc.setFont("helvetica", "bolditalic");
  doc.text("ESTIMATE", 190, 35, { align: "right" });
  
  // --- Divider ---
  doc.setDrawColor(colors.divider);
  doc.setLineWidth(0.5);
  // Dynamic line position based on if logo pushed text down or not, maxing at 65 or 42
  const lineY = Math.max(42, currentY + nameHeight + 5);
  doc.line(20, lineY, 190, lineY);

  // --- Company & Client Info ---
  const topY = lineY + 13;
  
  // Left Column: Bill To
  doc.setTextColor(colors.accent);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 20, topY);
  
  doc.setTextColor(colors.textPrimary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(client.name, 20, topY + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text(`${client.address.street}`, 20, topY + 13);
  doc.text(`${client.address.city}, ${client.address.state} ${client.address.zipCode}`, 20, topY + 18);
  doc.text(client.phone, 20, topY + 23);
  doc.text(client.email, 20, topY + 28);

  // Right Column: Company Info & Meta
  doc.setTextColor(colors.accent);
  doc.setFont("helvetica", "bold");
  doc.text("FROM:", 120, topY);
  
  doc.setTextColor(colors.textPrimary);
  doc.text("DETAILS:", 160, topY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary);
  
  // From Details
  doc.text(companyProfile.address, 120, topY + 7);
  doc.text(`${companyProfile.city}, ${companyProfile.state}`, 120, topY + 12);
  doc.text(companyProfile.phone, 120, topY + 17);
  doc.text(companyProfile.email, 120, topY + 22);

  // Meta Details
  doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 160, topY + 7);
  doc.text(`Exp: 30 Days`, 160, topY + 12);
  const shortId = estimate.id.includes('EST-') ? estimate.id.split('-')[1] : estimate.id;
  doc.text(`ID: #${shortId}`, 160, topY + 17);

  // --- Table Data Preparation ---
  const tableRows: any[] = [];
  
  estimate.rooms.forEach(room => {
    // Zone Header Row
    tableRows.push([{ 
      content: room.name.toUpperCase(), 
      colSpan: 4, 
      styles: { 
        fillColor: colors.card, 
        textColor: colors.textPrimary, // Changed to primary for better contrast in light mode
        fontStyle: 'bold',
        halign: 'left'
      } 
    }]);
    
    // Items for this room
    const roomItems = estimate.items.filter(i => i.roomId === room.id);
    
    roomItems.forEach(item => {
      // Find product details (Name/Unit) from the catalog using ID
      const product = products.find(p => p.id === item.productId);
      const productName = product ? product.name : 'Unknown Item';
      const productUnit = product ? product.unit : 'unit';

      tableRows.push([
        productName,
        `${item.quantity.toFixed(1)} ${productUnit}`,
        `$${item.unitPriceAtTime.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`
      ]);
    });
  });

  // --- Table Render ---
  autoTable(doc, {
    startY: topY + 35,
    head: [['ITEM / SERVICE', 'QTY', 'RATE', 'AMOUNT']],
    body: tableRows,
    headStyles: { 
      fillColor: colors.tableHeaderBg, 
      textColor: colors.tableHeaderText,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    theme: 'plain',
    styles: { 
      fontSize: 10, 
      cellPadding: 4,
      textColor: colors.tableBodyText,
      fillColor: colors.tableBodyBg,
      lineColor: colors.tableLine,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // --- Totals ---
  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || 150;
  
  doc.setFillColor(colors.card);
  doc.roundedRect(120, finalY + 10, 70, 35, 3, 3, "F");

  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary);
  doc.text("Subtotal", 130, finalY + 20);
  doc.text(`$${estimate.totalAmount.toFixed(2)}`, 180, finalY + 20, { align: 'right' });

  doc.text("Tax (Est)", 130, finalY + 26);
  doc.text(`$0.00`, 180, finalY + 26, { align: 'right' });

  doc.setFontSize(16);
  doc.setTextColor(colors.accent);
  doc.setFont("helvetica", "bolditalic");
  doc.text("TOTAL", 130, finalY + 38);
  doc.text(`$${estimate.totalAmount.toFixed(2)}`, 180, finalY + 38, { align: 'right' });

  // --- Terms ---
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(9);
  doc.setTextColor(colors.textSecondary);
  doc.text("TERMS & CONDITIONS", 20, pageHeight - 40);
  doc.setFontSize(8);
  doc.text(companyProfile.terms || "Payment due upon receipt.", 20, pageHeight - 35, { maxWidth: 100 });

  doc.setFontSize(8);
  doc.setTextColor(colors.textSecondary); 
  doc.text("Powered by Level Up ConstructionTech", 105, pageHeight - 10, { align: 'center' });

  return doc;
};
