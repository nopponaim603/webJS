import unicodedata
import re

with open("scratch/extracted_pdf_text.txt", "r", encoding="utf-8") as f:
    raw_lines = f.readlines()

filtered_lines = []
for line in raw_lines:
    l = line.strip()
    if not l or "Oxford University Press" in l or "The Oxford 3000" in l or l.startswith("==="):
        continue
    filtered_lines.append(l)

merged_entries = []
current_level = None
i = 0
while i < len(filtered_lines):
    line = filtered_lines[i]
    if line in ["A1", "A2", "B1", "B2"]:
        current_level = line
        i += 1
        continue
    
    # Check if this line continues onto the next line (ends with comma, slash, or unclosed paren)
    full_entry = line
    while (full_entry.endswith(",") or full_entry.endswith("/") or full_entry.endswith("det./") or full_entry.count("(") > full_entry.count(")")) and (i + 1 < len(filtered_lines)) and filtered_lines[i+1] not in ["A1", "A2", "B1", "B2"]:
        i += 1
        full_entry += " " + filtered_lines[i]
    
    merged_entries.append((current_level, full_entry))
    i += 1

print(f"Total merged entries: {len(merged_entries)}")

# Now test parsing
pos_regex = r"((\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|modal\s+v\.|auxiliary\s+v\.|number|exclam\.|indefinite\s+article|definite\s+article|infinitive\s+marker|linking\s+v\.)[\w\s\.,\/\(\)]*)|(\s+(n|v|adj|adv|prep|conj|pron|det)\.[\w\s\.,\/\(\)]*)|(\s+(number|indefinite\s+article|definite\s+article|exclam\.|det\.\/pron\.|adj\.\/pron\.|prep\.\/adv\.|det\.\/number)[\w\s\.,\/\(\)]*))$"

unmatched = []
for lvl, entry in merged_entries:
    clean_entry = unicodedata.normalize("NFKC", entry)
    clean_entry = clean_entry.replace("\xa0", " ").replace("\ufffd", "'")
    clean_entry = clean_entry.replace("no'one", "no one").replace("o'clock", "o'clock").replace("o' clock", "o'clock")
    
    match = re.search(pos_regex, clean_entry)
    if not match:
        unmatched.append((lvl, clean_entry))

print(f"Unmatched entries: {len(unmatched)}")
if unmatched:
    print("Unmatched samples:")
    for u in unmatched[:20]:
        print(u)
