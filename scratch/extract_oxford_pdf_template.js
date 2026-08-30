/**
 * Oxford 3000 PDF Extractor & Normalizer Template
 * 
 * วิธีการใช้งาน:
 * 1. วางไฟล์ Oxford 3000 PDF ลงในโฟลเดอร์ scratch/data_sources/
 * 2. รันคำสั่ง: node scratch/extract_oxford_pdf_template.js
 * 3. ไฟล์ผลลัพธ์จะถูก export ออกมาเป็น .csv ที่ public/games/oxford-3000/data/oxford3000_master.csv
 */

const fs = require('fs');
const path = require('path');

// ตัวอย่าง Pattern การจับคำศัพท์ Oxford 3000 จาก PDF Text:
// รูปแบบที่พบบ่อยในเอกสาร Oxford: "word pos. CEFR" เช่น "abandon v. B2", "ability n. A2"
const OXFORD_WORD_REGEX = /^([a-zA-Z\s\-'\(\)]+?)\s+(n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|modal\s+v\.|det\.|number)\s+(A1|A2|B1|B2)/gm;

function parseRawTextToCSV(rawText) {
    const records = [];
    let match;
    let id = 1;

    // Header CSV
    const csvHeader = 'id,word,part_of_speech,cefr_level,phonetic_uk,phonetic_us,thai_meaning,example_sentence,example_translation,category,distractors,audio_key\n';

    while ((match = OXFORD_WORD_REGEX.exec(rawText)) !== null) {
        const word = match[1].trim();
        const pos = match[2].trim();
        const cefr = match[3].trim();

        records.push({
            id: id++,
            word: word,
            part_of_speech: pos,
            cefr_level: cefr,
            phonetic_uk: '',
            phonetic_us: '',
            thai_meaning: '',
            example_sentence: '',
            example_translation: '',
            category: 'General',
            distractors: '',
            audio_key: word.toLowerCase().replace(/[^a-z0-9]/g, '_')
        });
    }

    return { records, csvHeader };
}

console.log('Oxford 3000 PDF Extractor Template Ready.');
