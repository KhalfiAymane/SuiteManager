export class PDFExporter {
  static export(data, filename, columns, title) {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create a printable HTML page
    const printWindow = window.open('', '_blank');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
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
          }
          th {
            background-color: #73AF6F;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .date {
            text-align: right;
            color: #666;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="date">${new Date().toLocaleDateString()}</div>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                ${columns.map(col => `<td>${item[col.field] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}