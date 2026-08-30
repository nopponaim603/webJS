import pypdf

pdf_path = r"docs\gdd\games\oxford-3000\The_Oxford_3000_by_CEFR_level.pdf"
reader = pypdf.PdfReader(pdf_path)

print(f"Total pages: {len(reader.pages)}")

for i in range(min(3, len(reader.pages))):
    print(f"\n--- PAGE {i+1} SAMPLE (first 1000 chars) ---")
    text = reader.pages[i].extract_text()
    print(text[:1000])
