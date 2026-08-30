with open("scratch/extracted_pdf_text.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if line.strip() in ['adj.', 'number']:
        print(f"Line {idx}: Context around {repr(line.strip())}:")
        for c in range(max(0, idx-3), min(len(lines), idx+4)):
            print(f"  {lines[c].strip()}")
