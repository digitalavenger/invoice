// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/utils/pdfGenerator.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, CompanySettings } from '../types';
import { format } from 'date-fns';

export const generatePDF = async (invoice: Invoice, companySettings: CompanySettings) => {
  // Create a temporary div element to render the invoice
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '12mm'; // Adjusted padding for balanced content space
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.fontFamily = 'Arial, Helvetica, sans-serif'; // Professional and widely available font
  tempDiv.style.boxSizing = 'border-box'; // Ensure padding is included in width/height

  // Define vibrant and professional colors
  const primaryColor = '#1D4ED8'; // A deep, vibrant blue (Tailwind blue-700)
  const textColor = '#333333'; // Darker text for professionalism
  const darkBorder = '#666666'; // Darker border for tables
  const headerBg = '#F3F4F6'; // Light grey for header row background
  const notesBg = '#EBF4FF'; // Very light blue for notes section background

  // HTML content for html2canvas
  tempDiv.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 0; font-family: inherit; color: ${textColor};">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 12px;">
        <div>
          <h1 style="color: ${primaryColor}; font-size: 34px; margin: 0; font-weight: bold; letter-spacing: 1.5px;">INVOICE</h1>
          <p style="color: #555; margin: 5px 0 0 0; font-size: 13px;">Invoice #${invoice.invoiceNumber}</p>
        </div>
        <div style="text-align: right;">
          <div id="pdf-logo-placeholder" style="width: 70px; height: 70px; margin-bottom: 8px; margin-left: auto;"></div>
          <h2 style="color: ${textColor}; margin: 0; font-size: 22px; font-weight: bold;">${companySettings.name}</h2>
          <div style="color: #666; font-size: 13px; line-height: 1.4; margin-top: 5px;">
            <div>${companySettings.address}</div>
            <div>Phone: ${companySettings.phone}</div>
            <div>Email: ${companySettings.email}</div>
            ${companySettings.website ? `<div>Website: ${companySettings.website}</div>` : ''}
            <div>GST: ${companySettings.gst}</div>
            <div>PAN: ${companySettings.pan}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h3 style="color: ${textColor}; margin: 0 0 8px 0; font-size: 17px;">Bill To:</h3>
          <div style="color: #374151; font-size: 14px; line-height: 1.6;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${invoice.customer.name}</div>
            <div>${invoice.customer.address}</div>
            <div>Phone: ${invoice.customer.phone}</div>
            <div>Email: ${invoice.customer.email}</div>
            ${invoice.customer.gst ? `<div>GST: ${invoice.customer.gst}</div>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #374151; font-size: 14px; line-height: 1.7;">
            <div><strong>Invoice Date:</strong> ${format(new Date(invoice.date), 'MMM dd,yyyy')}</div>
            <div><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM dd,yyyy')}</div>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: ${headerBg};">
            <th style="padding: 10px; text-align: left; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">Description</th>
            <th style="padding: 10px; text-align: center; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">Qty</th>
            <th style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">Rate</th>
            <th style="padding: 10px; text-align: center; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">GST%</th>
            <th style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">GST Amount</th>
            <th style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; font-weight: bold; color: ${textColor}; font-size: 13px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="padding: 10px; border: 1px solid ${darkBorder}; color: ${textColor}; font-size: 13px;">${item.description}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid ${darkBorder}; color: ${textColor}; font-size: 13px;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; color: ${textColor}; font-size: 13px;">₹${item.rate.toFixed(2)}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid ${darkBorder}; color: ${textColor}; font-size: 13px;">${item.gstRate}%</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; color: ${textColor}; font-size: 13px;">₹${item.gstAmount.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${darkBorder}; color: ${textColor}; font-weight: bold; font-size: 13px;">₹${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 280px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 13px;">Subtotal:</span>
            <span style="color: ${textColor}; font-weight: bold; font-size: 13px;">₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB;">
            <span style="color: #6B7280; font-size: 13px;">Total GST:</span>
            <span style="color: ${textColor}; font-weight: bold; font-size: 13px;">₹${invoice.totalGst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid ${primaryColor}; margin-top: 10px;">
            <span style="color: ${textColor}; font-size: 18px; font-weight: bold;">Total:</span>
            <span style="color: ${primaryColor}; font-size: 18px; font-weight: bold;">₹${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="margin-bottom: 15px;">
          <h3 style="color: ${textColor}; margin: 0 0 8px 0; font-size: 15px;">Notes:</h3>
          <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; padding: 10px; background-color: ${notesBg}; border-left: 4px solid ${primaryColor}; border-radius: 4px;">${invoice.notes}</p>
        </div>
      ` : ''}

      ${companySettings.bankName || companySettings.accountNumber || companySettings.ifscCode || companySettings.branchName ? `
        <div style="margin-top: 20px; margin-bottom: 15px; padding-top: 15px; border-top: 1px dashed ${darkBorder};">
          <h3 style="color: ${textColor}; margin: 0 0 8px 0; font-size: 15px;">Bank Details:</h3>
          <div style="color: #374151; font-size: 13px; line-height: 1.5;">
            ${companySettings.bankName ? `<div><strong>Bank Name:</strong> ${companySettings.bankName}</div>` : ''}
            ${companySettings.accountNumber ? `<div><strong>Account Number:</strong> ${companySettings.accountNumber}</div>` : ''}
            ${companySettings.ifscCode ? `<div><strong>IFSC Code:</strong> ${companySettings.ifscCode}</div>` : ''}
            ${companySettings.branchName ? `<div><strong>Branch Name:</strong> ${companySettings.branchName}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; padding-top: 12mm; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 11px; margin-top: auto;"> 
        <p style="margin: 0;">Thank you for your business!</p>
        <p style="margin: 2px 0 0 0;">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;

  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 3, 
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const logoX = 175; 
    const logoY = 15;  
    const logoWidth = 30; 
    const logoHeight = 30; 

    if (companySettings.logoBase64) {
      pdf.addImage(companySettings.logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    const imgWidth = 210; 
    const pageHeight = 297; 
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
      return '#1D4ED8'; 
    case 'paid':
      return '#10B981'; 
    default:
      return '#6B7280';
  }
};