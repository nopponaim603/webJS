with open("scratch/extracted_pdf_text.txt", "r", encoding="utf-8") as f:
    text = f.read()

# find lines with special chars
for line in text.splitlines()[:50]:
    if line.strip() and not line.startswith("===") and "Oxford" not in line:
        print(f"RAW: {repr(line)}")
