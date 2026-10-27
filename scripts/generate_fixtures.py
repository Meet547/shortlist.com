"""Create real, inspectable PDF and OOXML fixtures (no simulated geometry)."""
import json
import argparse
import subprocess
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile, ZIP_DEFLATED
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'samples'
OUT.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--input', type=Path, help='Optional fictional sample JSON; defaults to src/data.js.')
args = parser.parse_args()
payload = args.input.read_text(encoding='utf-8') if args.input else subprocess.run(['node', str(ROOT / 'scripts' / 'export_fixture_data.mjs')], cwd=ROOT, check=True, capture_output=True, text=True).stdout
samples = json.loads(payload)
W, H = 612, 792

def write_pdf(path, text, two_column=False):
    c = canvas.Canvas(str(path), pagesize=(W, H))
    c.setTitle('Shortlist ATS Lab — illustrative sample resume')
    c.setAuthor('Shortlist demo candidate — fictional')
    def draw(lines, x, y, width, size=8.7, leading=12):
        for raw in lines:
            clean = raw.replace('–', '-').replace('—', '-').replace('·', '|')
            for line in simpleSplit(clean, 'Helvetica', size, width) or ['']:
                if y < 52:
                    c.showPage()
                    y = H - 58
                c.setFont('Helvetica-Bold' if raw.isupper() else 'Helvetica', size)
                c.setFillColorRGB(.15, .2, .17)
                c.drawString(x, y, line)
                # Real PDF link annotations for contact URLs.
                if line.startswith('https://'):
                    url = line.split(' ')[0]
                    c.linkURL(url, (x, y-2, x + min(width, c.stringWidth(url, 'Helvetica', size)), y+size), relative=0)
                y -= leading
        return y
    if not two_column:
        draw(text.splitlines(), 49, H-58, W-98)
    else:
        # Real side-by-side text objects, intentionally emitted row by row.
        # The 17pt gap and alternating native stream order create a genuine trap.
        lines = text.splitlines()
        draw(lines[:4], 45, H-50, W-90, 9, 13)
        left = ['EDUCATION', 'B.Tech Mechanical Engineering', 'Pune Institute of Technology', 'Jun 2026', 'CGPA: 8.6 / 10.0', '', 'TECHNICAL SKILLS']
        left += [s.strip() for s in lines[-2].split(',')]
        left += ['SOLIDWORKS 85%', 'ANSYS 70%']
        right = lines[lines.index('INTERNSHIPS'):lines.index('TECHNICAL SKILLS')]
        left_lines = [part for line in left for part in (simpleSplit(line.replace('–','-').replace('—','-'), 'Helvetica', 8.5, 214) or [''])]
        right_lines = [part for line in right for part in (simpleSplit(line.replace('–','-').replace('—','-'), 'Helvetica', 8.5, 278) or [''])]
        y = 655
        # A right-aligned sidebar ends at 259pt; body text starts at 276pt.
        # Emit alternating objects to preserve an actual interleaving trap.
        for i in range(max(len(left_lines), len(right_lines))):
            c.setFont('Helvetica', 8.5)
            if i < len(left_lines):
                c.drawRightString(259, y, left_lines[i])
            if i < len(right_lines):
                c.drawString(276, y, right_lines[i])
            y -= 14
    c.save()

for domain, items in samples.items():
    write_pdf(OUT / f'anchored-{domain}.pdf', items['strong'])
    write_pdf(OUT / f'orphan-{domain}.pdf', items['weak'], two_column=True)
    (OUT / f'anchored-{domain}.txt').write_text(items['strong'])

def write_docx(path, text, trap=False):
    paras = ''.join(f'<w:p><w:r><w:t xml:space="preserve">{escape(line)}</w:t></w:r></w:p>' for line in text.splitlines())
    if trap:
        paras += '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Outer cell</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Nested FEA skill</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:tc></w:tr></w:tbl>'
        paras += '<w:p><w:r><w:pict><w:txbxContent><w:p><w:r><w:t>Floating textbox skill</w:t></w:r></w:p></w:txbxContent></w:pict></w:r></w:p>'
    with ZipFile(path, 'w', ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
        z.writestr('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/document.xml', f'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{paras}<w:sectPr/></w:body></w:document>')
        if trap:
            z.writestr('word/header1.xml', '<?xml version="1.0"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>hidden.contact@example.com +91 9988776655 https://github.com/hidden-demo</w:t></w:r></w:p></w:hdr>')

write_docx(OUT / 'anchored-aero.docx', samples['aero']['strong'])
write_docx(OUT / 'header-table-trap.docx', samples['aero']['weak'], True)
print(f'Generated {len(list(OUT.iterdir()))} real parsing fixtures in {OUT}')
