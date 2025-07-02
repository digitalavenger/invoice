import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, CompanySettings } from '../types';
import { format } from 'date-fns';

export const generatePDF = async (invoice: Invoice, companySettings: CompanySettings) => {
  // Create a temporary div element to render the invoice
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm';
  tempDiv.style.padding = '20mm';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.fontFamily = 'Arial, sans-serif';
  
  tempDiv.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
        <div>
          <h1 style="color: #3B82F6; font-size: 32px; margin: 0; font-weight: bold;">INVOICE</h1>
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Invoice #${invoice.invoiceNumber}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="color: #1F2937; margin: 0; font-size: 24px; font-weight: bold;">${companySettings.name}</h2>
          <div style="color: #666; font-size: 14px; line-height: 1.4; margin-top: 8px;">
            <div>${companySettings.address}</div>
            <div>Phone: ${companySettings.phone}</div>
            <div>Email: ${companySettings.email}</div>
            ${companySettings.website ? `<div>Website: ${companySettings.website}</div>` : ''}
            <div>GST: ${companySettings.gst}</div>
            <div>PAN: ${companySettings.pan}</div>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: #1F2937; margin: 0 0 10px 0; font-size: 18px;">Bill To:</h3>
          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${invoice.customer.name}</div>
            <div>${invoice.customer.address}</div>
            <div>Phone: ${invoice.customer.phone}</div>
            <div>Email: ${invoice.customer.email}</div>
            ${invoice.customer.gst ? `<div>GST: ${invoice.customer.gst}</div>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #374151; font-size: 14px; line-height: 1.8;">
            <div><strong>Invoice Date:</strong> ${format(new Date(invoice.date), 'MMM dd, yyyy')}</div>
            <div><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
            <div><strong>Status:</strong> <span style="background-color: ${getStatusColor(invoice.status)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${invoice.status.toUpperCase()}</span></div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #F3F4F6;">
            <th style="padding: 12px; text-align: left; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">Description</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">Qty</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">Rate</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">GST%</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">GST Amount</th>
            <th style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; font-weight: bold; color: #374151;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="padding: 12px; border: 1px solid #D1D5DB; color: #374151;">${item.description}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #D1D5DB; color: #374151;">${item.quantity}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; color: #374151;">₹${item.rate.toFixed(2)}</td>
              <td style="padding: 12px; text-align: center; border: 1px solid #D1D5DB; color: #374151;">${item.gstRate}%</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; color: #374151;">₹${item.gstAmount.toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border: 1px solid #D1D5DB; color: #374151; font-weight: bold;">₹${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #6B7280;">Subtotal:</span>
            <span style="color: #374151; font-weight: bold;">₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #6B7280;">Total GST:</span>
            <span style="color: #374151; font-weight: bold;">₹${invoice.totalGst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #3B82F6; margin-top: 8px;">
            <span style="color: #1F2937; font-size: 18px; font-weight: bold;">Total:</span>
            <span style="color: #3B82F6; font-size: 18px; font-weight: bold;">₹${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <!-- Notes -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1F2937; margin: 0 0 10px 0; font-size: 16px;">Notes:</h3>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0; padding: 12px; background-color: #F9FAFB; border-left: 4px solid #3B82F6; border-radius: 4px;">${invoice.notes}</p>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px;">
        <p style="margin: 0;">Thank you for your business!</p>
        <p style="margin: 5px 0 0 0;">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;

  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
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

    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  } finally {
    document.body.removeChild(tempDiv);
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'draft':
      return '#6B7280';
    case 'sent':
      return '#3B82F6';
    case 'paid':
      return '#10B981';
    default:
      return '#6B7280';
  }
};