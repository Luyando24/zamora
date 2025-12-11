import jsPDF from 'jspdf';

export const generateMenuPdf = (
  items: any[], 
  hotelName: string,
  logoUrl: string | null
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // --- Theme Colors ---
  const bgWhite = [255, 255, 255];
  const textDark = [15, 23, 42]; // Slate 900
  const textMuted = [100, 116, 139]; // Slate 500
  const accentColor = [200, 30, 80]; // A sophisticated red/pink

  // --- Helper Functions ---
  const centerText = (text: string, y: number, size: number, color: number[], font = 'helvetica', style = 'bold') => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  const drawPageHeader = () => {
    // Logo
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', margin, 10, 25, 25);
      } catch (e) {
        console.error("Error adding logo to header:", e);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(hotelName, margin, 20);
      }
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(hotelName, margin, 20);
    }
    
    // Line separator
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(margin, 40, pageWidth - margin, 40);
  };

  const addFooter = (pageNo: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    
    // Powered by
    doc.text('POWERED BY ZAMORA', margin, pageHeight - 10, { align: 'left' });

    // Page number
    doc.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // --- 1. FRONT COVER ---
  doc.setFillColor(bgWhite[0], bgWhite[1], bgWhite[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  if (logoUrl) {
    try {
      const imgProps = doc.getImageProperties(logoUrl);
      const aspectRatio = imgProps.width / imgProps.height;
      const imgWidth = 80;
      const imgHeight = imgWidth / aspectRatio;
      doc.addImage(logoUrl, 'PNG', (pageWidth - imgWidth) / 2, 60, imgWidth, imgHeight);
    } catch (e) {
        console.error("Error adding logo to cover:", e);
        centerText(hotelName, 100, 30, textDark);
    }
  } else {
    centerText(hotelName, 100, 30, textDark);
  }

  centerText('MENU', 140, 50, textDark, 'times', 'bold');
  
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 30, 150, pageWidth / 2 + 30, 150);

  centerText('Exquisite Dining Experience', 170, 12, textMuted, 'helvetica', 'normal');

  // --- 2. INNER PAGES ---
  const grouped = items.reduce((acc: any, item: any) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();
  let pageCount = 1;
  let yPos = 55; // Initial Y position after header

  categories.forEach((cat, index) => {
    if (index > 0) {
      doc.addPage();
      pageCount++;
    }
    drawPageHeader();
    yPos = 55;

    // Category Title
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(cat, margin, yPos);
    yPos += 15;

    // Items Loop
    grouped[cat].forEach((item: any) => {
      if (yPos > pageHeight - 40) {
        addFooter(pageCount);
        doc.addPage();
        pageCount++;
        drawPageHeader();
        yPos = 55;
      }

      // Item Name & Price
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(item.name, margin, yPos);
      
      const price = `K${item.price}`;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text(price, pageWidth - margin, yPos, { align: 'right' });
      yPos += 7;

      // Description
      if (item.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        const descLines = doc.splitTextToSize(item.description, pageWidth - (margin * 2));
        doc.text(descLines, margin, yPos);
        yPos += (descLines.length * 4.5) + 8;
      } else {
        yPos += 8;
      }
    });
    addFooter(pageCount);
  });

  // --- 3. BACK COVER ---
  doc.addPage();
  doc.setFillColor(bgWhite[0], bgWhite[1], bgWhite[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  centerText('Thank You', pageHeight / 2 - 10, 24, textDark, 'times', 'bold');
  centerText('We look forward to serving you again.', pageHeight / 2, 12, textMuted, 'helvetica', 'italic');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('POWERED BY ZAMORA', pageWidth / 2, pageHeight - 30, { align: 'center' });


  // Save
  doc.save(`${(hotelName || 'Menu').replace(/[^a-zA-Z0-9]/g, '_')}_Menu.pdf`);
};
