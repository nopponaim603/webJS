import pypdf
import re

pdf_path = r"docs\gdd\games\oxford-3000\The_Oxford_3000_by_CEFR_level.pdf"
reader = pypdf.PdfReader(pdf_path)

all_text = ""
for idx, page in enumerate(reader.pages):
    all_text += f"\n=== PAGE {idx+1} ===\n" + page.extract_text()

with open("scratch/extracted_pdf_text.txt", "w", encoding="utf-8") as f:
    f.write(all_text)

print("Saved scratch/extracted_pdf_text.txt. Total length:", len(all_text))
