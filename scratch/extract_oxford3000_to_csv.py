import os
import re
import csv
import unicodedata
import pypdf

def extract_oxford_pdf():
    pdf_path = os.path.join("docs", "gdd", "games", "oxford-3000", "The_Oxford_3000_by_CEFR_level.pdf")
    output_dir = os.path.join("public", "games", "oxford-3000", "data")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Reading PDF from: {pdf_path}")
    reader = pypdf.PdfReader(pdf_path)
    
    raw_lines = []
    for page in reader.pages:
        text = page.extract_text()
        for line in text.splitlines():
            l = line.strip()
            if not l or "Oxford University Press" in l or "The Oxford 3000" in l or "The Oxford 3000 is the list" in l:
                continue
            raw_lines.append(l)
            
    filtered_lines = []
    for line in raw_lines:
        l = line.strip()
        if not l:
            continue
        filtered_lines.append(l)

    # Merge wrapped lines (e.g. multi-line POS or notes in parentheses)
    merged_entries = []
    current_level = None
    i = 0
    while i < len(filtered_lines):
        line = filtered_lines[i]
        if line in ["A1", "A2", "B1", "B2"]:
            current_level = line
            i += 1
            continue
        
        full_entry = line
        while (full_entry.endswith(",") or full_entry.endswith("/") or full_entry.endswith("det./") or full_entry.count("(") > full_entry.count(")")) and (i + 1 < len(filtered_lines)) and filtered_lines[i+1] not in ["A1", "A2", "B1", "B2"]:
            i += 1
            full_entry += " " + filtered_lines[i]
        
        merged_entries.append((current_level, full_entry))
        i += 1

    pos_regex = r"((\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|modal\s+v\.|auxiliary\s+v\.|number|exclam\.|indefinite\s+article|definite\s+article|infinitive\s+marker|linking\s+v\.)[\w\s\.,\/\(\)]*)|(\s+(n|v|adj|adv|prep|conj|pron|det)\.[\w\s\.,\/\(\)]*)|(\s+(number|indefinite\s+article|definite\s+article|exclam\.|det\.\/pron\.|adj\.\/pron\.|prep\.\/adv\.|det\.\/number)[\w\s\.,\/\(\)]*))$"

    records = []
    level_counts = {}

    for idx, (lvl, entry) in enumerate(merged_entries, 1):
        clean_entry = unicodedata.normalize("NFKC", entry)
        clean_entry = clean_entry.replace("\xa0", " ").replace("\ufffd", "'")
        clean_entry = clean_entry.replace("no'one", "no one").replace("o'clock", "o'clock").replace("o' clock", "o'clock")
        
        match = re.search(pos_regex, clean_entry)
        if match:
            pos_part = match.group(0).strip()
            word_part = clean_entry[:match.start()].strip()
        else:
            parts = clean_entry.rsplit(" ", 1)
            word_part = parts[0].strip()
            pos_part = parts[1].strip() if len(parts) > 1 else ""

        # Extract notes like (money), (similar), 1, 2 from headwords
        note = ""
        headword = word_part
        note_match = re.search(r"\((.*?)\)", word_part)
        if note_match:
            note = note_match.group(1).strip()
            headword = re.sub(r"\s*\(.*?\)", "", headword).strip()
        
        # Remove trailing superscript numbers e.g. second1 -> second
        num_suffix = re.search(r"(\d+)$", headword)
        if num_suffix:
            if not note:
                note = f"sense {num_suffix.group(1)}"
            headword = re.sub(r"\d+$", "", headword).strip()

        audio_key = re.sub(r"[^a-z0-9]", "_", headword.lower().strip())
        
        record = {
            "id": idx,
            "word": headword,
            "part_of_speech": pos_part,
            "cefr_level": lvl,
            "phonetic_uk": "",
            "phonetic_us": "",
            "thai_meaning": "",
            "example_sentence": "",
            "example_translation": "",
            "category": "General",
            "distractors": "",
            "audio_key": audio_key,
            "note": note,
            "raw_entry": clean_entry
        }
        records.append(record)
        level_counts[lvl] = level_counts.get(lvl, 0) + 1

    # Write Master CSV
    master_csv_path = os.path.join(output_dir, "oxford3000_master.csv")
    fieldnames = [
        "id", "word", "part_of_speech", "cefr_level", 
        "phonetic_uk", "phonetic_us", "thai_meaning", 
        "example_sentence", "example_translation", 
        "category", "distractors", "audio_key", "note", "raw_entry"
    ]
    
    with open(master_csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    print(f"Exported Master CSV: {master_csv_path} (Total: {len(records)} words)")
    print(f"Counts by Level: {level_counts}")

    # Write Segmented CSVs by Level
    for lvl in ["A1", "A2", "B1", "B2"]:
        lvl_records = [r for r in records if r["cefr_level"] == lvl]
        lvl_path = os.path.join(output_dir, f"oxford_{lvl.lower()}.csv")
        with open(lvl_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(lvl_records)
        print(f"Exported {lvl}: {lvl_path} ({len(lvl_records)} words)")

if __name__ == "__main__":
    extract_oxford_pdf()
