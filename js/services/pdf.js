export class PDFExporter {
  static export(data, filename, columns, title) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a simple PDF-like structure using HTML canvas
    // This is a lightweight solution without external dependencies
    this.generatePDF(data, filename, columns, title);
  }

  static generatePDF(data, filename, columns, title) {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      left: -9999px;
      width: 800px;
      background: white;
      padding: 40px;
      font-family: Arial, sans-serif;
    `;

    // Build the HTML content
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h1 style="margin: 0 0 10px 0; color: #333;">${title}</h1>
        <p style="margin: 0; color: #666;">${new Date().toLocaleDateString()}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #73AF6F; color: white;">
            ${columns.map(col => `
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">
                ${col.label}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map((item, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#f9f9f9' : 'white'};">
              ${columns.map(col => `
                <td style="border: 1px solid #ddd; padding: 10px;">
                  ${item[col.field] || ''}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.body.appendChild(container);

    // Use html2canvas and jspdf from CDN
    import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
      .then(() => import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'))
      .then(() => {
        window.html2canvas(container, {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new window.jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save(`${filename}_${this.getFormattedDate()}.pdf`);
          
          // Cleanup
          document.body.removeChild(container);
        });
      })
      .catch(error => {
        console.error('Error loading PDF libraries:', error);
        document.body.removeChild(container);
        alert('Failed to generate PDF. Please try again.');
      });
  }

  static getFormattedDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}