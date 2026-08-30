import re
import unicodedata

with open("scratch/extracted_pdf_text.txt", "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()

current_level = None
parsed_dataset = []

# Recognized POS keywords
# n., v., adj., adv., prep., conj., pron., det., modal, auxiliary, number, indefinite, definite, exclam., etc.

for line in lines:
    line_str = line.strip()
    if not line_str:
        continue
    if "Oxford University Press" in line_str or "The Oxford 3000" in line_str or line_str.startswith("==="):
        continue
    if line_str in ["A1", "A2", "B1", "B2"]:
        current_level = line_str
        continue
    
    # Normalize unicode & replace weird characters
    line_clean = unicodedata.normalize("NFKC", line_str)
    line_clean = line_clean.replace("\xa0", " ")
    line_clean = line_clean.replace("\ufffd", "'")
    line_clean = line_clean.replace("o'clock", "o'clock").replace("o' clock", "o'clock")
    line_clean = line_clean.replace("no'one", "no one")
    
    # Match word vs part of speech
    # Patterns: usually word is on the left, POS starts with n., v., adj., adv., prep., conj., pron., det., modal v., auxiliary v., number, exclam., indefinite article, etc.
    pos_regex = r"((\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|modal\s+v\.|auxiliary\s+v\.|number|exclam\.|indefinite\s+article|definite\s+article|infinitive\s+marker|linking\s+v\.)[\w\s\.,\/\(\)]*)|(\s+(n|v|adj|adv|prep|conj|pron|det)\.[\w\s\.,\/\(\)]*))$"
    
    match = re.search(pos_regex, line_clean)
    if match:
        pos_part = match.group(0).strip()
        word_part = line_clean[:match.start()].strip()
    else:
        # Fallback split by last space if POS is single word like 'number'
        parts = line_clean.rsplit(" ", 1)
        if len(parts) == 2:
            word_part = parts[0].strip()
            pos_part = parts[1].strip()
        else:
            word_part = line_clean
            pos_part = ""

    parsed_dataset.append({
        "level": current_level,
        "word": word_part,
        "pos": pos_part,
        "raw": line_clean
    })

print(f"Total parsed: {len(parsed_dataset)}")

# Check any items without pos or empty word
empty_pos = [item for item in parsed_dataset if not item["pos"]]
print(f"Items with empty pos ({len(empty_pos)}):")
for ep in empty_pos:
    print(ep)

print("\nSample parsed items (15 random/various):")
for item in parsed_dataset[::220]:
    print(item)
