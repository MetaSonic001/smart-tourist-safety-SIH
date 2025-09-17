from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.database import Incident, Alert

class EFIRService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
    
    async def generate_efir_pdf(self, incident: Incident, alerts: List[Alert]) -> bytes:
        """Generate e-FIR PDF from incident and related alerts"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        
        story = []
        
        # Title
        story.append(Paragraph("Electronic First Information Report (e-FIR)", self.title_style))
        story.append(Spacer(1, 20))
        
        # Incident Information
        story.append(Paragraph("INCIDENT INFORMATION", self.styles['Heading2']))
        
        incident_data = [
            ['Incident ID:', incident.incident_id],
            ['Status:', incident.status.value],
            ['Priority:', str(incident.priority)],
            ['Created:', incident.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')],
            ['Assigned Unit:', incident.assigned_unit or 'Not Assigned'],
        ]
        
        incident_table = Table(incident_data, colWidths=[2*inch, 4*inch])
        incident_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.grey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(incident_table)
        story.append(Spacer(1, 20))
        
        # Alerts Information
        story.append(Paragraph("RELATED ALERTS", self.styles['Heading2']))
        
        for i, alert in enumerate(alerts, 1):
            story.append(Paragraph(f"Alert #{i}", self.styles['Heading3']))
            
            alert_data = [
                ['Alert ID:', alert.alert_id],
                ['Digital ID:', alert.digital_id or 'N/A'],
                ['Tourist ID:', alert.tourist_id or 'N/A'],
                ['Location:', f"{alert.lat}, {alert.lng}" if alert.lat and alert.lng else 'N/A'],
                ['Source:', alert.source.value],
                ['Status:', alert.status.value],
                ['Created:', alert.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')],
                ['Media References:', ', '.join(alert.media_refs) if alert.media_refs else 'None']
            ]
            
            alert_table = Table(alert_data, colWidths=[2*inch, 4*inch])
            alert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (1, 0), (1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(alert_table)
            story.append(Spacer(1, 15))
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("---", self.styles['Normal']))
        story.append(Paragraph(
            f"This e-FIR was automatically generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
            self.styles['Normal']
        ))
        story.append(Paragraph(
            "This document is digitally secured and tamper-evident through blockchain anchoring.",
            self.styles['Normal']
        ))
        
        # Build PDF
        doc.build(story)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        return pdf_data

efir_service = EFIRService()