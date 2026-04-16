"""
Professional invoice PDF generator using ReportLab.
Generates clean, branded invoice PDFs with full layout.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from io import BytesIO
import datetime


# ─── Color Palette ──────────────────────────────────────────────────────────
PRIMARY    = colors.HexColor("#1E293B")   # slate-800
ACCENT     = colors.HexColor("#4F46E5")   # indigo-600
MUTED      = colors.HexColor("#64748B")   # slate-500
LIGHT_GRAY = colors.HexColor("#F1F5F9")   # slate-100
BORDER     = colors.HexColor("#E2E8F0")   # slate-200
GREEN      = colors.HexColor("#10B981")   # emerald-500
RED        = colors.HexColor("#EF4444")   # red-500
AMBER      = colors.HexColor("#F59E0B")   # amber-500
WHITE      = colors.white


STATUS_COLORS = {
    "draft":     colors.HexColor("#94A3B8"),
    "sent":      colors.HexColor("#3B82F6"),
    "viewed":    colors.HexColor("#8B5CF6"),
    "paid":      GREEN,
    "overdue":   RED,
    "cancelled": colors.HexColor("#6B7280"),
}


def _currency(amount: float, symbol: str = "$") -> str:
    return f"{symbol}{amount:,.2f}"


def generate_invoice_pdf(invoice, user) -> bytes:
    """Generate a professional invoice PDF and return bytes."""
    buffer = BytesIO()
    page_w, page_h = A4

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()

    # ── Custom Styles ─────────────────────────────────────────────────────────
    def make_style(name, parent="Normal", **kwargs):
        return ParagraphStyle(name, parent=styles[parent], **kwargs)

    style_h1 = make_style("H1", fontSize=28, textColor=PRIMARY, leading=34, fontName="Helvetica-Bold")
    style_h2 = make_style("H2", fontSize=14, textColor=PRIMARY, leading=18, fontName="Helvetica-Bold")
    style_h3 = make_style("H3", fontSize=11, textColor=PRIMARY, leading=14, fontName="Helvetica-Bold")
    style_body = make_style("Body", fontSize=9.5, textColor=PRIMARY, leading=14)
    style_muted = make_style("Muted", fontSize=8.5, textColor=MUTED, leading=12)
    style_label = make_style("Label", fontSize=7.5, textColor=MUTED, leading=10,
                              fontName="Helvetica", spaceAfter=1)
    style_value = make_style("Value", fontSize=9.5, textColor=PRIMARY, leading=13, fontName="Helvetica-Bold")
    style_amount = make_style("Amount", fontSize=9.5, textColor=PRIMARY, leading=13,
                               alignment=TA_RIGHT)
    style_amount_bold = make_style("AmountBold", fontSize=11, textColor=PRIMARY, leading=14,
                                    fontName="Helvetica-Bold", alignment=TA_RIGHT)
    style_total = make_style("Total", fontSize=14, textColor=WHITE, leading=18,
                              fontName="Helvetica-Bold", alignment=TA_RIGHT)
    style_notes = make_style("Notes", fontSize=8.5, textColor=MUTED, leading=13)
    style_footer = make_style("Footer", fontSize=8, textColor=MUTED, leading=11, alignment=TA_CENTER)

    story = []

    usable_w = page_w - 36 * mm  # left + right margins

    # ════════════════════════════════════════════════════════════════════════
    # HEADER: Company info LEFT + Invoice details RIGHT
    # ════════════════════════════════════════════════════════════════════════

    company_name = user.company_name or user.full_name
    invoice_num  = invoice.invoice_number
    status_val   = invoice.status.value if invoice.status else "draft"
    status_color = STATUS_COLORS.get(status_val, MUTED)
    status_label = status_val.upper()

    company_block = [
        Paragraph(company_name, style_h1),
        Spacer(1, 3),
    ]
    if user.address:
        company_block.append(Paragraph(user.address, style_body))
    if user.city and user.country:
        company_block.append(Paragraph(f"{user.city}, {user.country}", style_body))
    elif user.city:
        company_block.append(Paragraph(user.city, style_body))
    if user.phone:
        company_block.append(Paragraph(user.phone, style_body))
    company_block.append(Paragraph(user.email, style_body))
    if user.website:
        company_block.append(Paragraph(user.website, style_muted))

    # Status badge style cell
    status_style = ParagraphStyle(
        "StatusBadge",
        fontSize=10,
        textColor=WHITE,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        leading=14,
    )

    invoice_details_right = [
        [Paragraph("INVOICE", make_style("InvLabel", fontSize=9, textColor=MUTED,
                                          fontName="Helvetica-Bold", alignment=TA_RIGHT)),
         Paragraph("")],
        [Paragraph(invoice_num, make_style("InvNum", fontSize=16, textColor=ACCENT,
                                           fontName="Helvetica-Bold", alignment=TA_RIGHT)),
         Paragraph("")],
    ]

    # Header table
    header_data = [[
        company_block[0],
        Table(
            [
                [Paragraph(f'<font color="white"><b>{status_label}</b></font>',
                           make_style("SB", fontSize=9, textColor=WHITE, fontName="Helvetica-Bold",
                                      alignment=TA_RIGHT))]
            ],
            colWidths=[50 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), status_color),
                ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("ROUNDEDCORNERS", [4, 4, 4, 4]),
            ])
        ),
    ]]

    col_l = usable_w * 0.60
    col_r = usable_w * 0.40

    ht = Table(header_data, colWidths=[col_l, col_r])
    ht.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(ht)

    # Company details under name
    for para in company_block[1:]:
        story.append(para)

    story.append(Spacer(1, 8 * mm))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceAfter=6 * mm))

    # ════════════════════════════════════════════════════════════════════════
    # INVOICE METADATA: Invoice # / Dates  |  Bill To
    # ════════════════════════════════════════════════════════════════════════

    client = invoice.client
    client_block = []
    if client:
        if client.company:
            client_block.append(Paragraph(client.company, style_h3))
        client_block.append(Paragraph(client.name, style_body))
        if client.address:
            client_block.append(Paragraph(client.address, style_body))
        if client.city and client.country:
            client_block.append(Paragraph(f"{client.city}, {client.country}", style_body))
        if client.email:
            client_block.append(Paragraph(client.email, style_body))
        if client.phone:
            client_block.append(Paragraph(client.phone, style_muted))
    else:
        client_block.append(Paragraph("—", style_body))

    def date_str(d):
        if d:
            return d.strftime("%B %d, %Y")
        return "—"

    meta_rows = [
        [
            Paragraph("INVOICE NUMBER", style_label),
            Paragraph("ISSUE DATE", style_label),
            Paragraph("DUE DATE", style_label),
            Paragraph("PAYMENT TERMS", style_label),
        ],
        [
            Paragraph(invoice_num, style_value),
            Paragraph(date_str(invoice.issue_date), style_value),
            Paragraph(date_str(invoice.due_date), style_value),
            Paragraph(f"Net {invoice.payment_terms or 30}", style_value),
        ],
    ]
    if invoice.paid_date:
        meta_rows[0].append(Paragraph("PAID DATE", style_label))
        meta_rows[1].append(Paragraph(date_str(invoice.paid_date), make_style(
            "PaidV", fontSize=9.5, textColor=GREEN, fontName="Helvetica-Bold")))

    meta_col_count = len(meta_rows[0])
    meta_col_w = (col_l - 5 * mm) / meta_col_count

    meta_table = Table(meta_rows, colWidths=[meta_col_w] * meta_col_count)
    meta_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    bill_to_section = [
        Paragraph("BILL TO", style_label),
        Spacer(1, 2),
    ] + client_block

    meta_and_bill = Table(
        [[meta_table, "\n".join([str(x) for x in bill_to_section])]],
        colWidths=[col_l, col_r]
    )

    # Rebuild as proper nested table
    from reportlab.platypus import KeepTogether

    bill_data = [[Paragraph("BILL TO", style_label)]] + [[p] for p in client_block]
    bill_table = Table(bill_data, colWidths=[col_r])
    bill_table.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    main_meta = Table(
        [[meta_table, bill_table]],
        colWidths=[col_l, col_r]
    )
    main_meta.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    story.append(main_meta)
    story.append(Spacer(1, 8 * mm))

    # ════════════════════════════════════════════════════════════════════════
    # LINE ITEMS TABLE
    # ════════════════════════════════════════════════════════════════════════

    col_desc  = usable_w * 0.50
    col_qty   = usable_w * 0.12
    col_rate  = usable_w * 0.19
    col_amt   = usable_w * 0.19

    item_header = [
        Paragraph("DESCRIPTION", make_style("IH", fontSize=8, textColor=WHITE,
                                             fontName="Helvetica-Bold")),
        Paragraph("QTY", make_style("IH2", fontSize=8, textColor=WHITE,
                                    fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Paragraph("UNIT PRICE", make_style("IH3", fontSize=8, textColor=WHITE,
                                           fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Paragraph("AMOUNT", make_style("IH4", fontSize=8, textColor=WHITE,
                                       fontName="Helvetica-Bold", alignment=TA_RIGHT)),
    ]

    table_data = [item_header]
    row_styles = []

    for idx, item in enumerate(invoice.items):
        bg = LIGHT_GRAY if idx % 2 == 0 else WHITE
        row = [
            Paragraph(item.description, style_body),
            Paragraph(f"{item.quantity:g}", make_style(f"Q{idx}", fontSize=9.5,
                                                       textColor=PRIMARY, alignment=TA_RIGHT)),
            Paragraph(_currency(item.unit_price), make_style(f"R{idx}", fontSize=9.5,
                                                             textColor=PRIMARY, alignment=TA_RIGHT)),
            Paragraph(_currency(item.amount), make_style(f"A{idx}", fontSize=9.5,
                                                         textColor=PRIMARY, fontName="Helvetica-Bold",
                                                         alignment=TA_RIGHT)),
        ]
        table_data.append(row)
        data_row = idx + 1  # +1 for header
        row_styles.append(("BACKGROUND", (0, data_row), (-1, data_row), bg))

    items_table = Table(
        table_data,
        colWidths=[col_desc, col_qty, col_rate, col_amt],
        repeatRows=1,
    )
    items_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), ACCENT),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, 0), 8),
        ("RIGHTPADDING", (0, 0), (-1, 0), 8),
        # Data rows
        ("TOPPADDING", (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
        ("LEFTPADDING", (0, 1), (-1, -1), 8),
        ("RIGHTPADDING", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        # Bottom border per row
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, BORDER),
        ("LINEBELOW", (0, -1), (-1, -1), 1, BORDER),
        *row_styles,
    ]))

    story.append(items_table)
    story.append(Spacer(1, 6 * mm))

    # ════════════════════════════════════════════════════════════════════════
    # TOTALS SECTION
    # ════════════════════════════════════════════════════════════════════════

    subtotal = invoice.subtotal or 0
    tax_rate = invoice.tax_rate or 0
    tax_amt  = invoice.tax_amount or 0
    disc     = invoice.discount_amount or 0
    total    = invoice.total or 0

    totals_style = make_style("TL", fontSize=9.5, textColor=MUTED, alignment=TA_RIGHT)
    totals_val_style = make_style("TV", fontSize=9.5, textColor=PRIMARY, fontName="Helvetica-Bold",
                                  alignment=TA_RIGHT)

    totals_rows = [
        [Paragraph("Subtotal", totals_style), Paragraph(_currency(subtotal), totals_val_style)],
    ]
    if tax_rate:
        totals_rows.append([
            Paragraph(f"Tax ({tax_rate:.1f}%)", totals_style),
            Paragraph(_currency(tax_amt), totals_val_style),
        ])
    if disc:
        totals_rows.append([
            Paragraph("Discount", totals_style),
            Paragraph(f"- {_currency(disc)}", make_style("DiscV", fontSize=9.5,
                                                          textColor=RED, fontName="Helvetica-Bold",
                                                          alignment=TA_RIGHT)),
        ])
    # Total row with accent background
    totals_rows.append([
        Paragraph("TOTAL DUE", make_style("TotalL", fontSize=12, textColor=WHITE,
                                          fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        Paragraph(_currency(total), make_style("TotalV", fontSize=14, textColor=WHITE,
                                               fontName="Helvetica-Bold", alignment=TA_RIGHT)),
    ])

    n_rows = len(totals_rows)
    total_row_idx = n_rows - 1

    col_lbl_w = 60 * mm
    col_val_w = 45 * mm
    totals_table = Table(totals_rows, colWidths=[col_lbl_w, col_val_w])
    totals_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -2), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -2), 5),
        ("TOPPADDING", (0, total_row_idx), (-1, total_row_idx), 10),
        ("BOTTOMPADDING", (0, total_row_idx), (-1, total_row_idx), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, total_row_idx), (-1, total_row_idx), ACCENT),
        ("LINEABOVE", (0, total_row_idx), (-1, total_row_idx), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    totals_outer = Table(
        [["", totals_table]],
        colWidths=[usable_w - col_lbl_w - col_val_w, col_lbl_w + col_val_w]
    )
    totals_outer.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(totals_outer)

    # ════════════════════════════════════════════════════════════════════════
    # NOTES & PAYMENT INSTRUCTIONS
    # ════════════════════════════════════════════════════════════════════════

    if invoice.notes:
        story.append(Spacer(1, 8 * mm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=4 * mm))
        story.append(Paragraph("NOTES & PAYMENT INSTRUCTIONS", style_label))
        story.append(Spacer(1, 2))
        for line in invoice.notes.split("\n"):
            if line.strip():
                story.append(Paragraph(line.strip(), style_notes))
            else:
                story.append(Spacer(1, 3))

    # ════════════════════════════════════════════════════════════════════════
    # FOOTER
    # ════════════════════════════════════════════════════════════════════════

    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=3 * mm))

    footer_text = f"Generated by FreelanceOS · {company_name}"
    if user.tax_number:
        footer_text += f" · {user.tax_number}"
    footer_text += f" · {invoice_num}"

    story.append(Paragraph(footer_text, style_footer))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
