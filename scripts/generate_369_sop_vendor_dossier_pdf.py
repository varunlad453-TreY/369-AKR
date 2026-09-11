#!/usr/bin/env python3
r"""
==============================================================================
Executive Clean & Professional PDF Generator
369 AKR UNIVERSE SOLAR EPC PVT. LTD.
Subcontractor Empanelment & KYC Compliance Dossier
Target: G:\369 Daily\Swarajya_Construction_and_Developers_AKR-1114_Official_Dossier.pdf
==============================================================================
"""

import os
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Flowable
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.barcode import qr

# ==============================================================================
# COLOR PALETTE (Ultra-Clean Institutional & Solar Corporate)
# ==============================================================================
C_PRIMARY = colors.HexColor("#0B132B")        # Deep Midnight Navy
C_PRIMARY_LIGHT = colors.HexColor("#1C2541")  # Slate Navy for headers
C_TEXT_MAIN = colors.HexColor("#0F172A")      # Near Black / Slate 900
C_TEXT_MUTED = colors.HexColor("#64748B")     # Cool Slate 500
C_TEXT_LIGHT = colors.HexColor("#94A3B8")     # Slate 400
C_ACCENT_AMBER = colors.HexColor("#D97706")   # Refined Solar Amber
C_BORDER = colors.HexColor("#E2E8F0")         # Subtle Slate 200 Border
C_BORDER_DARK = colors.HexColor("#CBD5E1")    # Slate 300
C_BG_LIGHT = colors.HexColor("#F8FAFC")       # Off-white Slate 50
C_SUCCESS = colors.HexColor("#059669")        # Crisp Emerald 600
C_SUCCESS_DARK = colors.HexColor("#065F46")   # Emerald 800
C_SUCCESS_BG = colors.HexColor("#ECFDF5")     # Light Emerald Tint
C_SUCCESS_BORDER = colors.HexColor("#A7F3D0") # Soft Emerald Border


# ==============================================================================
# CLEAN INSTITUTIONAL CANVAS
# ==============================================================================
class ProfessionalDossierCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        w, h = A4

        # Ultra-clean Top Accent Line (Navy + Amber accent)
        self.setFillColor(C_PRIMARY)
        self.rect(0, h - 4, w, 4, fill=True, stroke=False)
        self.setFillColor(C_ACCENT_AMBER)
        self.rect(0, h - 4, w * 0.28, 4, fill=True, stroke=False)

        self.restoreState()


# ==============================================================================
# SECTION HEADING FLOWABLE (01 VENDOR IDENTIFICATION)
# ==============================================================================
class SectionHeaderFlowable(Flowable):
    def __init__(self, number_str, title_str, width=531, height=14):
        super().__init__()
        self.number_str = number_str
        self.title_str = title_str
        self.width = width
        self.height = height

    def wrap(self, availWidth, availHeight):
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.saveState()

        # Modern Number prefix (01, 02, etc.)
        c.setFont("Helvetica-Bold", 8.0)
        c.setFillColor(C_TEXT_MUTED)
        c.drawString(0, 3, self.number_str)
        num_w = c.stringWidth(self.number_str, "Helvetica-Bold", 8.0)

        # Bold uppercase title
        c.setFont("Helvetica-Bold", 8.2)
        c.setFillColor(C_TEXT_MAIN)
        c.drawString(num_w + 6, 3, self.title_str.upper())

        c.restoreState()


# ==============================================================================
# VECTOR QR CODE COMPONENT
# ==============================================================================
def make_qr_drawing(url, size=58):
    qrw = qr.QrCodeWidget(url)
    b = qrw.getBounds()
    w = b[2] - b[0]
    h = b[3] - b[1]
    d = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
    d.add(qrw)
    return d


# ==============================================================================
# MAIN DOCUMENT GENERATOR
# ==============================================================================
def generate_vendor_dossier_pdf(target_path=None):
    if target_path:
        pdf_path = Path(target_path)
    else:
        out_dir = Path(r"G:\369 Daily")
        out_dir.mkdir(parents=True, exist_ok=True)
        pdf_path = out_dir / "Swarajya_Construction_and_Developers_AKR-1114_Official_Dossier.pdf"

    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"[*] Generating Clean & Professional Vendor Dossier PDF -> {pdf_path}")

    # Standard A4: 595.27 x 841.89 pt
    # Clean 32pt margins -> usable width = 531.27 pt
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=A4,
        leftMargin=32,
        rightMargin=32,
        topMargin=26,
        bottomMargin=24
    )

    styles = getSampleStyleSheet()

    # Typography Hierarchy
    style_company_name = ParagraphStyle(
        "CompanyName",
        fontName="Helvetica-Bold",
        fontSize=13.0,
        leading=15.5,
        textColor=C_PRIMARY,
        spaceAfter=1
    )

    style_directorate = ParagraphStyle(
        "Directorate",
        fontName="Helvetica",
        fontSize=7.8,
        leading=10.0,
        textColor=colors.HexColor("#334155"),
        spaceAfter=2
    )

    style_meta_line = ParagraphStyle(
        "MetaLine",
        fontName="Helvetica",
        fontSize=6.5,
        leading=8.5,
        textColor=C_TEXT_MUTED
    )

    style_confidential = ParagraphStyle(
        "ConfidentialBox",
        fontName="Helvetica-Bold",
        fontSize=7.2,
        leading=9.0,
        textColor=C_PRIMARY,
        alignment=1
    )

    style_ref_info = ParagraphStyle(
        "RefInfo",
        fontName="Courier",
        fontSize=6.8,
        leading=9.0,
        textColor=C_TEXT_MAIN,
        alignment=2
    )

    style_doc_title = ParagraphStyle(
        "DocTitle",
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=14.0,
        textColor=C_PRIMARY,
        alignment=1,
        textTransform="uppercase",
        spaceAfter=2
    )

    style_doc_subtitle = ParagraphStyle(
        "DocSubtitle",
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.2,
        textColor=C_TEXT_MUTED,
        alignment=1,
        spaceAfter=4
    )

    style_label = ParagraphStyle(
        "FieldLabel",
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.5,
        textColor=C_TEXT_MUTED,
        textTransform="uppercase"
    )

    style_val = ParagraphStyle(
        "FieldVal",
        fontName="Helvetica",
        fontSize=7.2,
        leading=9.0,
        textColor=C_TEXT_MAIN
    )

    style_val_bold = ParagraphStyle(
        "FieldValBold",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=C_TEXT_MAIN
    )

    style_val_code = ParagraphStyle(
        "FieldValCode",
        fontName="Courier-Bold",
        fontSize=7.5,
        leading=9.2,
        textColor=C_PRIMARY
    )

    style_th = ParagraphStyle(
        "TableHead",
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.5,
        textColor=colors.white,
        textTransform="uppercase"
    )

    style_badge_text = ParagraphStyle(
        "BadgeText",
        fontName="Helvetica-Bold",
        fontSize=6.4,
        leading=7.8,
        textColor=C_SUCCESS_DARK,
        alignment=1
    )

    TOTAL_W = 531.0
    story = []

    # =========================================================================
    # 1. CLEAN CORPORATE HEADER
    # =========================================================================
    header_left = [
        Paragraph("369 AKR UNIVERSE SOLAR EPC PVT. LTD.", style_company_name),
        Paragraph("Directorate of Subcontractor Operations &amp; Quality Compliance", style_directorate),
        Paragraph("CIN: U40106MH2024PTC000369 &nbsp;|&nbsp; www.369akruniverse.com &nbsp;|&nbsp; ops@369akruniverse.in", style_meta_line),
    ]

    confidential_box = Table(
        [[Paragraph("CONFIDENTIAL", style_confidential)]],
        colWidths=[88],
        rowHeights=[16]
    )
    confidential_box.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.75, C_TEXT_MAIN),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))

    header_right = [
        confidential_box,
        Spacer(1, 3),
        Paragraph("Doc. Ref: <b>AKR/VND/2026/AKR1114</b>", style_ref_info),
        Paragraph("Issued: <b>11 September 2026</b>", style_ref_info),
    ]

    t_header = Table(
        [[header_left, header_right]],
        colWidths=[385, 146]
    )
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 6))

    # Clean Divider Line
    t_divider = Table([[""]], colWidths=[TOTAL_W], rowHeights=[1])
    t_divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, C_BORDER_DARK),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_divider)
    story.append(Spacer(1, 9))

    # =========================================================================
    # 2. DOCUMENT TITLE & PURPOSE
    # =========================================================================
    story.append(Paragraph("SUBCONTRACTOR EMPANELMENT &amp; KYC COMPLIANCE DOSSIER", style_doc_title))
    story.append(Paragraph("Official vendor credential record, issued for internal audit, statutory compliance, and field dispatch authorization purposes.", style_doc_subtitle))
    story.append(Spacer(1, 9))

    # =========================================================================
    # 3. SECTION 01: VENDOR IDENTIFICATION & DIGITAL VERIFICATION
    # =========================================================================
    story.append(SectionHeaderFlowable("01", "VENDOR IDENTIFICATION", width=TOTAL_W))
    story.append(Spacer(1, 4))

    # Status Pill
    badge_active = Table(
        [[Paragraph("ACTIVE — VERIFIED CONTRACTOR", style_badge_text)]],
        colWidths=[150], rowHeights=[13]
    )
    badge_active.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 0.6, C_SUCCESS_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))

    specs_data = [
        [Paragraph("Vendor Code", style_label), Paragraph("<b>AKR-1114</b>", style_val_code)],
        [Paragraph("Empanelment Status", style_label), badge_active],
        [Paragraph("Registered Entity Name", style_label), Paragraph("<b>Swarajya Construction and Developers</b>", style_val_bold)],
        [Paragraph("Constitution", style_label), Paragraph("Proprietorship", style_val)],
        [Paragraph("Authorized Signatory", style_label), Paragraph("<b>Yogesh Dnyaneshwar Magar</b>", style_val_bold)],
        [Paragraph("Registered Mobile (OTP Gateway)", style_label), Paragraph("+919552628232", style_val_code)],
        [Paragraph("Email Address", style_label), Paragraph("swarajya.construction1611@gmail.com", style_val)],
        [Paragraph("Principal Place of Business", style_label), Paragraph("At Malharwadi, Post Hingoli, Hingoli, Hingoli, Maharashtra - 431513", style_val)]
    ]

    t_specs = Table(specs_data, colWidths=[140, 268])
    t_specs.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-2), 0.4, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3.0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.0),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))

    # Right Digital Verification Box (Card style)
    qr_drawing = make_qr_drawing("https://369akruniverse.com/gateway?code=AKR-1114", size=60)
    style_qr_head = ParagraphStyle("QRHead", fontName="Helvetica-Bold", fontSize=6.5, leading=8.0, textColor=colors.white, alignment=1)
    style_qr_url = ParagraphStyle("QRUrl", fontName="Courier-Bold", fontSize=6.2, leading=7.8, textColor=C_PRIMARY, alignment=1)
    style_qr_sub = ParagraphStyle("QRSub", fontName="Helvetica", fontSize=5.6, leading=7.0, textColor=C_TEXT_MUTED, alignment=1)

    t_qr_head = Table([[Paragraph("DIGITAL VERIFICATION", style_qr_head)]], colWidths=[114], rowHeights=[14])
    t_qr_head.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
    ]))

    qr_box_content = [
        t_qr_head,
        Spacer(1, 4),
        Table([[qr_drawing]], colWidths=[114], rowHeights=[66], style=[('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE')]),
        Spacer(1, 2),
        Paragraph("/gateway?code=AKR-1114", style_qr_url),
        Paragraph("Scan to verify empanelment &amp; access field gateway", style_qr_sub),
    ]

    t_qr_card = Table([[qr_box_content]], colWidths=[118])
    t_qr_card.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.6, C_BORDER_DARK),
        ('BACKGROUND', (0,0), (-1,-1), colors.white),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))

    sec1_layout = Table(
        [[t_specs, t_qr_card]],
        colWidths=[409, 122]
    )
    sec1_layout.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(sec1_layout)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 4. SECTION 02: STATUTORY & REGULATORY REGISTRATIONS
    # =========================================================================
    story.append(SectionHeaderFlowable("02", "STATUTORY & REGULATORY REGISTRATIONS", width=TOTAL_W))
    story.append(Spacer(1, 4))

    sec2_data = [
        [
            Paragraph("Registration Type", style_th),
            Paragraph("Registration Number", style_th),
            Paragraph("Verification Status", style_th)
        ],
        [
            Paragraph("GSTIN (State Code 27 — Maharashtra)", style_val),
            Paragraph("27ENRPM7534P1ZV", style_val_code),
            Paragraph("<font color='#059669'><b>Verified</b></font> — Regular Taxpayer", style_val)
        ],
        [
            Paragraph("MSME Udyam Registration", style_val),
            Paragraph("UDYAM-MH-12-0015908", style_val_code),
            Paragraph("<font color='#059669'><b>Verified</b></font> — Micro Enterprise", style_val)
        ],
        [
            Paragraph("Income Tax PAN", style_val),
            Paragraph("ENRPM7534P", style_val_code),
            Paragraph("<font color='#059669'><b>Verified</b></font> — Aadhaar Seeded", style_val)
        ]
    ]
    t_sec2 = Table(sec2_data, colWidths=[185, 160, 186])
    t_sec2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,1), (-1,-1), 0.4, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sec2)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 5. SECTION 03: VERIFIED SETTLEMENT BANKING DETAILS
    # =========================================================================
    story.append(SectionHeaderFlowable("03", "VERIFIED SETTLEMENT BANKING DETAILS", width=TOTAL_W))
    story.append(Spacer(1, 4))

    badge_ready = Table(
        [[Paragraph("Ready — Eligible for Direct Milestone Disbursement", style_badge_text)]],
        colWidths=[240], rowHeights=[13]
    )
    badge_ready.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 0.6, C_SUCCESS_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))

    sec3_data = [
        [Paragraph("Bank &amp; Account Type", style_label), Paragraph("<b>HDFC Bank</b> — Biz Pro Plus Current Account", style_val)],
        [Paragraph("Account Number", style_label), Paragraph("50200124368375", style_val_code)],
        [Paragraph("IFSC Code", style_label), Paragraph("HDFC0001991", style_val_code)],
        [Paragraph("Branch Address", style_label), Paragraph("Hingoli - Nawa Mondha, Plot No 8/163", style_val)],
        [Paragraph("Settlement Status", style_label), badge_ready]
    ]
    t_sec3 = Table(sec3_data, colWidths=[140, 391])
    t_sec3.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-2), 0.4, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_sec3)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 6. SECTION 04: VERIFIED COMPLIANCE DOCUMENTS ON RECORD
    # =========================================================================
    story.append(SectionHeaderFlowable("04", "VERIFIED COMPLIANCE DOCUMENTS ON RECORD", width=TOTAL_W))
    story.append(Spacer(1, 4))

    badge_v = Table([[Paragraph("Verified", style_badge_text)]], colWidths=[52], rowHeights=[12])
    badge_v.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_SUCCESS_BG),
        ('BOX', (0,0), (-1,-1), 0.5, C_SUCCESS_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.2),
    ]))

    sec4_data = [
        [
            Paragraph("Document", style_th),
            Paragraph("Reference / Identifier", style_th),
            Paragraph("Status", ParagraphStyle("THRight", parent=style_th, alignment=1))
        ],
        [
            Paragraph("Form GST REG-06 Registration Certificate", style_val),
            Paragraph("27ENRPM7534P1ZV", style_val_code),
            badge_v
        ],
        [
            Paragraph("MSME Udyam Registration Certificate", style_val),
            Paragraph("UDYAM-MH-12-0015908", style_val_code),
            badge_v
        ],
        [
            Paragraph("HDFC Bank Account Confirmation Statement", style_val),
            Paragraph("50200124368375", style_val_code),
            badge_v
        ],
        [
            Paragraph("UIDAI Aadhaar Card (Front)", style_val),
            Paragraph("9978 0205 9920", style_val_code),
            badge_v
        ],
        [
            Paragraph("UIDAI Aadhaar Card (Back / Address Proof)", style_val),
            Paragraph("9978 0205 9920", style_val_code),
            badge_v
        ],
        [
            Paragraph("Income Tax Department PAN Card", style_val),
            Paragraph("ENRPM7534P", style_val_code),
            badge_v
        ]
    ]
    t_sec4 = Table(sec4_data, colWidths=[255, 204, 72])
    t_sec4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_PRIMARY),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,1), (-1,-1), 0.4, C_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 2.8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.8),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_sec4)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 7. OPERATIONAL DIRECTIVE (Clean accent bar callout)
    # =========================================================================
    style_dir_head = ParagraphStyle("DirHead", fontName="Helvetica-Bold", fontSize=7.2, leading=9.0, textColor=C_PRIMARY)
    style_dir_text = ParagraphStyle("DirText", fontName="Helvetica", fontSize=6.8, leading=9.2, textColor=colors.HexColor("#334155"))

    dir_content = [
        Paragraph("OPERATIONAL DIRECTIVE", style_dir_head),
        Spacer(1, 2),
        Paragraph(
            "The Vendor Code <b>AKR-1114</b> is to be used exclusively at the Contractor Field Gateway (<b>/gateway</b>) with registered mobile OTP authentication. "
            "All installation milestone proofs must be submitted with GPS geotagging enabled to permit engineering verification and automated disbursement processing.",
            style_dir_text
        )
    ]
    t_directive = Table([[dir_content]], colWidths=[TOTAL_W])
    t_directive.setStyle(TableStyle([
        ('LINELEFT', (0,0), (-1,-1), 2.5, C_PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_directive)
    story.append(Spacer(1, 18))

    # =========================================================================
    # 8. SIGNATURES & COMPLIANCE AUTHORITY
    # =========================================================================
    style_sign_head = ParagraphStyle("SignHead", fontName="Helvetica-Bold", fontSize=7.5, leading=9.5, textColor=C_PRIMARY)
    style_sign_sub = ParagraphStyle("SignSub", fontName="Helvetica", fontSize=6.5, leading=8.5, textColor=C_TEXT_MUTED)

    left_sign = [
        Paragraph("System-Generated Record", style_sign_head),
        Paragraph("Prepared by AKR Universe Digital Compliance Engine", style_sign_sub),
    ]

    right_sign = [
        Paragraph("Authorized Signatory", ParagraphStyle("RHead", parent=style_sign_head, alignment=2)),
        Paragraph("Directorate of Subcontractor Operations; 369 AKR Universe", ParagraphStyle("RSub", parent=style_sign_sub, alignment=2)),
    ]

    t_signatures = Table(
        [[left_sign, right_sign]],
        colWidths=[265, 266]
    )
    t_signatures.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 0.5, C_BORDER_DARK),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_signatures)
    story.append(Spacer(1, 16))

    # =========================================================================
    # 9. DOCUMENT CONTROL & STATUTORY FOOTER
    # =========================================================================
    style_footer_legal = ParagraphStyle(
        "FooterLegal",
        fontName="Helvetica",
        fontSize=5.6,
        leading=7.2,
        textColor=C_TEXT_LIGHT
    )
    style_footer_meta = ParagraphStyle(
        "FooterMeta",
        fontName="Courier",
        fontSize=5.8,
        leading=7.5,
        textColor=C_TEXT_LIGHT,
        alignment=2
    )

    footer_left = Paragraph(
        "This is a system-generated compliance document. It is valid without a physical signature and is digitally authorized by 369 AKR Universe Solar EPC Pvt. Ltd. "
        "Any unauthorized alteration renders this document void. Distribution restricted to internal audit, compliance, and empanelled contractor use only",
        style_footer_legal
    )

    footer_right = [
        Paragraph("Doc. Ref: <b>AKR/VND/2026/AKR1114</b>", style_footer_meta),
        Paragraph("Generated: 11 September 2026, 04:59 pm IST", style_footer_meta),
    ]

    t_footer = Table(
        [[footer_left, footer_right]],
        colWidths=[385, 146]
    )
    t_footer.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 0.4, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_footer)

    # Build PDF
    doc.build(story, canvasmaker=ProfessionalDossierCanvas)
    print(f"[+] Successfully built Clean & Professional Vendor Dossier PDF -> {pdf_path}")

    # Also synchronize to G:\369 Daily if built to a custom/temp location
    try:
        default_dir = Path(r"G:\369 Daily")
        default_dir.mkdir(parents=True, exist_ok=True)
        default_target = default_dir / "Swarajya_Construction_and_Developers_AKR-1114_Official_Dossier.pdf"
        if pdf_path.resolve() != default_target.resolve():
            import shutil
            shutil.copy2(str(pdf_path), str(default_target))
            print(f"[+] Synced copy to G:\\369 Daily -> {default_target}")
    except Exception as e:
        print(f"[!] Note: Could not sync copy to G:\\369 Daily: {e}")

    return str(pdf_path)


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    generate_vendor_dossier_pdf(target)
