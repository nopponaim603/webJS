import re

with open("scratch/extracted_pdf_text.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

current_level = "Unknown"
level_counts = {}
parsed_words = []

header_footer_patterns = [
    re.compile(r"^\s*=== PAGE \d+ ===\s*$"),
    re.compile(r"^\s*.*Oxford University Press.*$"),
    re.compile(r"^\s*The Oxford 3000.*$"),
    re.compile(r"^\s*$")
]

for line in lines:
    line_clean = line.strip()
    if not line_clean:
        continue
    
    # Check header / footer
    if any(p.match(line_clean) for p in header_footer_patterns):
        continue
    
    # Check level switch
    if line_clean in ["A1", "A2", "B1", "B2"]:
        current_level = line_clean
        if current_level not in level_counts:
            level_counts[current_level] = 0
        continue
    
    # Fix character encoding quirks in PDF (e.g. \ufffd or special spaces/quotes)
    # e.g., "o\ufffdclock" -> "o'clock", "no\ufffdone" -> "no one"
    clean_entry = line_clean.replace("oclock", "o'clock").replace("noone", "no one").replace("a,an", "a, an")
    clean_entry = clean_entry.replace("", "'")
    
    level_counts[current_level] = level_counts.get(current_level, 0) + 1
    parsed_words.append((current_level, clean_entry))

print("Word count by Level:", level_counts)
print("Total words parsed:", len(parsed_words))
print("\nFirst 10 words:")
for w in parsed_words[:10]:
    print(w)

print("\nLast 10 words:")
for w in parsed_words[-10:]:
    print(w)
