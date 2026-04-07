const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const path = require('path');

const pdfPath = path.join(__dirname, '..', 'CompTIA Security+ SY0-701 Exam Objectives (7.0).pdf');

async function analyzePdf() {
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  
  const result = await parser.getText();
  const text = result.text;
  
  // Save text to a temporary file for manual inspection if needed
  fs.writeFileSync(path.join(__dirname, 'pdf_output.txt'), text);
  
  console.log("PDF Text Extracted. Length:", text.length);
  // Log a sample slice to see structure
  console.log("Sample (lines 1000-2000):", text.substring(1000, 2000));
  
  await parser.destroy();
}

analyzePdf().catch(console.error);
