export class PDFExporter {
  static export(data, filename, columns, title) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
      console.warn('jsPDF not loaded, falling back to print method');
      this.exportWithPrint(data, filename, columns, title);
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text(title, 14, 22);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data
      const headers = [columns.map(col => col.label)];
      const rows = data.map(item => 
        columns.map(col => {
          let value = item[col.field] || '';
          if (col.field === 'createdAt' && value) {
            value = new Date(value).toLocaleDateString();
          }
          return String(value);
        })
      );

      // Add table
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: {
          fillColor: [115, 175, 111],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [249, 249, 249]
        }
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount} | Total Records: ${data.length}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`${filename}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF with jsPDF:', error);
      alert('Error generating PDF. Falling back to print method.');
      this.exportWithPrint(data, filename, columns, title);
    }
  }

  static exportWithPrint(data, filename, columns, title) {
    // Fallback to print method
    const printWindow = window.open('', '_blank');
    
    if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
      alert('Popup blocked! Please allow popups for this site to export PDF.');
      return;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
          }
          .header {
            margin-bottom: 30px;
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
          }
          .date {
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
            font-size: 14px;
          }
          th {
            background-color: #73AF6F;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 10px;
            }
            .no-print {
              display: none;
            }
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #73AF6F;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
          }
          .print-button:hover {
            background-color: #5d8f5a;
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        
        <div class="header">
          <h1>${title}</h1>
          <div class="date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${columns.map(col => {
                  let value = item[col.field] || '';
                  if (col.field === 'createdAt' && value) {
                    value = new Date(value).toLocaleDateString();
                  }
                  return `<td>${value}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Total Records: ${data.length}</p>
          <p>Hotel Management System</p>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check your browser settings.');
      if (printWindow) {
        printWindow.close();
      }
    }
  }
}