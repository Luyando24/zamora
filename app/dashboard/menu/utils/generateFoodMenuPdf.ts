import jsPDF from 'jspdf';

export const generateFoodMenuPdf = (items: any[], hotelName: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Colors
  const colorDark = [20, 20, 20];      // #141414
  const colorAccent = [236, 72, 153];  // #EC4899 (Pink-600 to match food menu theme)
  const colorWhite = [255, 255, 255];
  const colorGray = [180, 180, 180];

  // Helper: Background
  const drawBackground = () => {
    doc.setFillColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Corner Accents
    doc.setFillColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.triangle(0, 0, 60, 0, 0, 60, 'F');
    doc.triangle(pageWidth, pageHeight, pageWidth - 60, pageHeight, pageWidth, pageHeight - 60, 'F');
  };

  // Helper: Center Text
  const centerText = (text: string, y: number, size: number, color: number[], font = 'helvetica', style = 'bold') => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  // --- 1. FRONT COVER ---
  drawBackground();
  
  // "MENU" Title
  centerText('MENU', 60, 60, colorAccent);
  
  // Decorative Line/Shape under MENU
  doc.setDrawColor(colorAccent[0], colorAccent[1], colorAccent[2]);
  doc.setLineWidth(2);
  doc.line(pageWidth / 2 - 30, 65, pageWidth / 2 + 30, 65);

  // Hotel Name
  // Draw a "Brush" background for the name
  doc.setFillColor(colorAccent[0], colorAccent[1], colorAccent[2]);
  // Random-ish polygon to simulate brush stroke
  doc.triangle(margin, 130, pageWidth - margin, 120, pageWidth - margin, 160, 'F');
  doc.triangle(margin, 130, margin, 170, pageWidth - margin, 160, 'F');
  
  centerText(hotelName.toUpperCase(), 152, 24, colorDark);

  // Subtitle / Slogan
  centerText('FINE DINING EXPERIENCE', 180, 12, colorWhite, 'helvetica', 'normal');

  // Bottom Info
  centerText('OPEN DAILY', pageHeight - 50, 10, colorAccent);
  centerText('Breakfast - Lunch - Dinner', pageHeight - 42, 12, colorWhite);

  // --- 2. INNER PAGES ---
  doc.addPage();
  drawBackground();
  let yPos = 30;

  // Inner Header
  doc.setFontSize(24);
  doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
  doc.text('FOOD SELECTION', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Group items
  const grouped = items.reduce((acc: any, item: any) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  categories.forEach((cat) => {
    // Check page break (need space for header + at least one item)
    if (yPos > pageHeight - 40) {
        doc.addPage();
        drawBackground();
        yPos = 30;
    }

    // Category Header
    doc.setFillColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.rect(margin, yPos - 6, 80, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.text(cat.toUpperCase(), margin + 2, yPos);
    yPos += 12;

    // Items
    grouped[cat].forEach((item: any) => {
        // Check item height estimation
        // Name line + Description lines + Weight/Dietary line + padding
        let itemHeight = 5; // Name line
        
        let descLines: string[] = [];
        if (item.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2) - 30);
            itemHeight += (descLines.length * 4);
        }
        
        if (item.weight || item.dietary_info) {
            itemHeight += 5;
        }
        
        itemHeight += 4; // Spacing

        if (yPos + itemHeight > pageHeight - 20) {
            doc.addPage();
            drawBackground();
            yPos = 30;
        }

        // Draw Item Name & Price
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(colorWhite[0], colorWhite[1], colorWhite[2]);
        doc.text(item.name, margin, yPos);
        doc.text(`K${item.price}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        // Draw Description
        if (item.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
            doc.text(descLines, margin, yPos);
            yPos += (descLines.length * 4);
        }

        // Draw Weight & Dietary Info
        if (item.weight || item.dietary_info) {
            yPos += 1;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            
            let infoX = margin;
            
            if (item.weight) {
                doc.setTextColor(colorGray[0], colorGray[1], colorGray[2]);
                doc.text(item.weight, infoX, yPos);
                infoX += doc.getTextWidth(item.weight) + 5;
            }
            
            if (item.dietary_info) {
                doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
                doc.text(item.dietary_info, infoX, yPos);
            }
            
            yPos += 4;
        }

        yPos += 4; // Space between items
    });
    yPos += 8; // Space between categories
  });

  // --- 3. BACK COVER ---
  doc.addPage();
  drawBackground();

  // "Thank You" Message
  centerText('THANK YOU', 100, 30, colorAccent);
  centerText('FOR DINING WITH US', 115, 16, colorWhite);

  // Contact / Info Placeholder
  doc.setDrawColor(colorWhite[0], colorWhite[1], colorWhite[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 20, 130, pageWidth / 2 + 20, 130);

  // Fake Contact Details (since we might not have them in props)
  centerText('RESERVATIONS', 150, 12, colorAccent);
  centerText('+260 970 000 000', 160, 14, colorWhite);
  
  centerText('VISIT US', 180, 12, colorAccent);
  centerText('www.zamora.app', 190, 14, colorWhite);

  // Footer Branding
  centerText('Powered by Zamora', pageHeight - 20, 8, colorGray, 'helvetica', 'italic');

  // Save
  doc.save(`${(hotelName || 'Menu').replace(/[^a-zA-Z0-9]/g, '_')}_Booklet.pdf`);
};
