"""
PDF Invoice Generator using ReportLab
Generates professional invoice PDFs matching the original receipt format
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from database import get_settings


def generate_invoice_pdf(bill_data: dict) -> BytesIO:
    """
    Generate a PDF invoice from bill data
    Returns a BytesIO buffer containing the PDF
    """
    settings = get_settings()
    buffer = BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    company_style = ParagraphStyle(
        'CompanyName',
        parent=styles['Title'],
        fontSize=18,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_CENTER,
        spaceAfter=2*mm
    )
    
    address_style = ParagraphStyle(
        'Address',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#555555'),
        alignment=TA_CENTER,
        spaceAfter=1*mm
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=1*mm
    )
    
    total_style = ParagraphStyle(
        'TotalStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold'
    )
    
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#27ae60'),
        alignment=TA_CENTER,
        spaceAfter=2*mm
    )
    
    elements = []
    
    # --- Company Header ---
    elements.append(Paragraph(settings.company_name, company_style))
    elements.append(Paragraph(settings.company_address.replace('\n', '<br/>'), address_style))
    elements.append(Paragraph(f"Phone: {settings.company_phone}", address_style))
    elements.append(Paragraph(f"GSTIN: {settings.company_gstin}", address_style))
    elements.append(Spacer(1, 3*mm))
    
    # --- Separator ---
    separator_data = [['─' * 80]]
    separator = Table(separator_data, colWidths=[170*mm])
    separator.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#cccccc')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 6),
    ]))
    elements.append(separator)
    elements.append(Spacer(1, 3*mm))
    
    # --- Bill Info ---
    bill_info_data = [
        [f"Bill No: {bill_data.get('bill_no', '')}", f"Date: {bill_data.get('date', '')}"],
        [f"Customer: {bill_data.get('customer_name', 'Cash Sale')}", f"Phone: {bill_data.get('customer_phone', '')}"],
        [f"Place: {bill_data.get('place', '')}", f"Site: {bill_data.get('site', '')}"],
        [f"Payment: {bill_data.get('payment_type', 'Cash')}", f"Type: {bill_data.get('bill_type', 'Retail')}"],
    ]
    
    bill_info_table = Table(bill_info_data, colWidths=[85*mm, 85*mm])
    bill_info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(bill_info_table)
    elements.append(Spacer(1, 4*mm))
    
    # --- Items Table ---
    items = bill_data.get('items', [])
    table_data = [['S.No', 'Brand', 'Product', 'Qty', 'Rate (Rs.)', 'Amount (Rs.)']]
    
    for i, item in enumerate(items, 1):
        brand = item.get('brand', '')[:8]
        if len(item.get('brand', '')) > 8:
            brand += '...'
        table_data.append([
            str(i),
            brand,
            item.get('name', ''),
            f"{item.get('qty', 0):.2f}",
            f"{item.get('rate', 0):.2f}",
            f"{item.get('amount', 0):.2f}"
        ])
    
    col_widths = [12*mm, 25*mm, 55*mm, 18*mm, 25*mm, 30*mm]
    items_table = Table(table_data, colWidths=col_widths)
    items_table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        
        # Body
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # S.No
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),    # Qty
        ('ALIGN', (4, 1), (4, -1), 'RIGHT'),    # Rate
        ('ALIGN', (5, 1), (5, -1), 'RIGHT'),    # Amount
        
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        
        # Padding
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4*mm))
    
    # --- Totals ---
    subtotal = bill_data.get('subtotal', 0)
    include_gst = bill_data.get('include_gst', False)
    cgst = bill_data.get('cgst', 0)
    sgst = bill_data.get('sgst', 0)
    total = bill_data.get('total', 0)
    
    totals_data = []
    totals_data.append(['', '', '', '', 'Subtotal:', f"Rs.{subtotal:.2f}"])
    
    if include_gst:
        totals_data.append(['', '', '', '', 'CGST @9%:', f"Rs.{cgst:.2f}"])
        totals_data.append(['', '', '', '', 'SGST @9%:', f"Rs.{sgst:.2f}"])
    
    totals_data.append(['', '', '', '', 'TOTAL:', f"Rs.{total:.2f}"])
    
    totals_table = Table(totals_data, colWidths=col_widths)
    totals_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (4, 0), (4, -1), 'RIGHT'),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),
        ('FONTNAME', (-2, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (-2, -1), (-1, -1), 11),
        ('TEXTCOLOR', (-2, -1), (-1, -1), colors.HexColor('#2c3e50')),
        ('LINEABOVE', (-2, -1), (-1, -1), 1, colors.HexColor('#2c3e50')),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 8*mm))
    
    # --- Footer ---
    elements.append(Paragraph("Thank you for your business!", footer_style))
    elements.append(Paragraph("Please visit again!", footer_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
