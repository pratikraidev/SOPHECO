const express = require("express");
const router = express.Router();
const fs = require("node:fs");
const { db } = require("../firebase");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/invoice", function (req, res, next) {
  const PDFDocument = require("pdfkit");
  const outputPath = "public/file.pdf";
  const doc = new PDFDocument();

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Header
  const companyName = "SOPHECO PRIVATE LIMITED";
  doc
    .fontSize(18)
    .fillColor("#4A148C")
    .text("SOLUTION FOR POWERFUL HEARING AND COMMUNICATION", {
      align: "center",
    })
    .moveDown();

  doc
    .fontSize(12)
    .fillColor("black")
    .text(
      "SHOP N- 332, BASEMENT ZAKIR NAGAR, NEW FRIENDS COLONY NEXT TO JAMIA BANK, ZAKIR NAGAR DHALAAN, DELHI, 110025",
      { align: "center" }
    )
    .moveDown();

  doc.text(`Invoice No. SO/MU/24`, { align: "right" });
  doc.text(`March 13, 2025`, { align: "right" }).moveDown();

  // Billing Information
  doc
    .fontSize(12)
    .text("BILLED TO:", { underline: true })
    .text("Mr. Tarun Kochhar")
    .text("+91-9811313306")
    .moveDown();

  // Table Header
  doc
    .fontSize(10)
    .fillColor("white")
    .rect(50, doc.y, 500, 20)
    .fill("#4A148C")
    .text("ITEM DESCRIPTION", 55, doc.y + 5, { width: 200 })
    .text("QTY", 270, doc.y + 5)
    .text("TOTAL", 400, doc.y + 5)
    .fillColor("black");

  doc.moveDown();

  // Table Rows
  doc
    .text("KIT INSIO C & GO 1IX", 55, doc.y)
    .text("2 YEAR WARRANTY", 55, doc.y + 15)
    .text("1", 275, doc.y)
    .text("₹1,13,990.00", 400, doc.y)
    .moveDown(2);

  doc
    .text("CHARGER", 55, doc.y)
    .text("*1 YEAR WARRANTY", 55, doc.y + 15)
    .moveDown(2);

  // Discount
  doc
    .fontSize(10)
    .text("Rebate & Discount. IGST Exempted", 55, doc.y)
    .text("(-)₹48,990.00", 400, doc.y)
    .moveDown(2);

  // Total Amount
  doc
    .rect(50, doc.y, 500, 20)
    .fill("#4A148C")
    .fillColor("white")
    .text("Total Amount", 55, doc.y + 5)
    .text("₹65,000.00", 400, doc.y + 5)
    .fillColor("black");

  doc.moveDown(2);

  doc
    .text("Amount chargeable (in words):", { underline: true })
    .text("INR Sixty five thousand only")
    .moveDown();

  // Footer
  doc
    .text(companyName, { underline: true })
    .text(`Company's PAN: ABMCS2566D`)
    .moveDown();

  doc.text("Declaration:", { underline: true });
  doc.text("1) 2 years Manufacturing Warranty.");
  doc.text("2) 100% payment against delivery.");
  doc.text("3) Delivery within 3 working days after making payment.");
  doc.text("Term and conditions apply.", { bold: true }).moveDown();

  // Signature
  doc.text("DEEPIKA ARYA (Audiologist)");
  doc.text("Contact No.: +91-9006164420");

  // Finalize PDF
  doc.end();
  console.log(`Invoice generated: ${outputPath}`);
});

router.get("/db", async (req, res, next) => {
  const colRef = await db.collection("invoice").add({
    name: "123",
    age: 12,
  });
  res.send(200);
});

router.get("/table", function (req, res, next) {
  const fs = require("fs");
  const PDFDocument = require("pdfkit-table");
  
  // start pdf document
  let doc = new PDFDocument({ margin: 30, size: 'A4' });
  // to save on server
  doc.pipe(fs.createWriteStream("./document.pdf"));

  // -----------------------------------------------------------------------------------------------------
  // Simple Table with Array
  // -----------------------------------------------------------------------------------------------------
  const tableArray = {
    headers: ["Country", "Conversion rate", "Trend"],
    rows: [
      ["Switzerland", "12%", "+1.12%"],
      ["France", "67%", "-0.98%"],
      ["England", "33%", "+4.44%"],
    ],
  };
  doc.table( tableArray, { width: 300, }); // A4 595.28 x 841.89 (portrait) (about width sizes)
  
  // move to down
  doc.moveDown(); // separate tables
  
  // -----------------------------------------------------------------------------------------------------
  // Complex Table with Object
  // -----------------------------------------------------------------------------------------------------
  // A4 595.28 x 841.89 (portrait) (about width sizes)
  const table = {
    headers: [
      { label:"Name", property: 'name', width: 60, renderer: null },
      { label:"Description", property: 'description', width: 150, renderer: null }, 
      { label:"Price 1", property: 'price1', width: 100, renderer: null }, 
      { label:"Price 2", property: 'price2', width: 100, renderer: null }, 
      { label:"Price 3", property: 'price3', width: 80, renderer: null }, 
      { label:"Price 4", property: 'price4', width: 63, renderer: (value, indexColumn, indexRow, row) => { return `U$ ${Number(value).toFixed(2)}` } },
    ],
    datas: [
    { description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean mattis ante in laoreet egestas. ', price1: '$1', price3: '$ 3', price2: '$2', price4: '4', name: 'Name 1', },
    { name: 'bold:Name 2', description: 'bold:Lorem ipsum dolor.', price1: 'bold:$1', price3: '$3', price2: '$2', price4: '4', options: { fontSize: 10, separation: true } },
    { name: 'Name 3', description: 'Lorem ipsum dolor.', price1: 'bold:$1', price4: '4.111111', price2: '$2', price3: { label:'PRICE $3', options: { fontSize: 12 } }, },
  ],
    rows: [
      [
        "Apple",
        "Nullam ut facilisis mi. Nunc dignissim ex ac vulputate facilisis.",
        "$ 105,99",
        "$ 105,99",
        "$ 105,99",
        "105.99",
      ],
      [
        "Tire",
        "Donec ac tincidunt nisi, sit amet tincidunt mauris. Fusce venenatis tristique quam, nec rhoncus eros volutpat nec. Donec fringilla ut lorem vitae maximus. Morbi ex erat, luctus eu nulla sit amet, facilisis porttitor mi.",
        "$ 105,99",
        "$ 105,99",
        "$ 105,99",
        "105.99",
      ],
    ],
  };
  
  doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: (row, indexColumn, indexRow, rectRow) => {
    doc.font("Helvetica").fontSize(8);
    indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? 'blue' : 'green'), 0.15);
  },
  });
  
  doc.moveDown(1);
  
  const tableArrayColor = {
  headers: ["Country", "Conversion rate", "Trend"],
  rows: [
    ["Switzerland", "12%", "+1.12%"],
    ["France", "67%", "-0.98%"],
    ["Brazil", "88%", "2.77%"],
  ],
  };
  doc.table( tableArrayColor, { 
  
  width: 400,
  x: 150,
  columnsSize: [200,100,100],
  
  prepareRow: (row, indexColumn, indexRow, rectRow) => {
    doc.font("Helvetica").fontSize(10);
    indexColumn === 0 && doc.addBackground(rectRow, (indexRow % 2 ? 'red' : 'green'), 0.5);
  },
  
  }); // A4 595.28 x 841.89 (portrait) (about width sizes)
  
  
  // if your run express.js server:
  // HTTP response only to show pdf
  // doc.pipe(res);
  
  // done

  doc.moveDown(1);
  doc.text("hello")
  doc.end();
});

router.get("/header", (req, res, next) => {
  const fs = require("fs");
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ size: "A4", margin: 0 });

  // Output file
  const stream = fs.createWriteStream("output.pdf");
  doc.pipe(stream);

  // Dark Purple Left Section
  doc.rect(0, 0, 249, 30).fill("#2E0052");

  // White Slant Divider
  doc
    .moveTo(250, 0)
    .lineTo(210, 30)
    .lineTo(250, 30)
    .fillAndStroke("white")

  doc
    .moveTo(260, 0)
    .lineTo(240, 15)
    .lineTo(270, 15)
    .fill("#3A5ADB");

  // Blue Section
  doc.rect(260, 0, 866, 15).fill("#3A5ADB");

  doc.moveDown();
  doc.image('public/logo.png', 450, 30, {width: 100, height:74}).moveDown();

  doc
  .font('Helvetica-Bold')
  .fillColor("#4A148C")
  .text('SOLUTION FOR POWERFUL HEARING AND COMMUNICATION', 192, 110, {}).moveDown();

  doc.font('Helvetica').fillColor("black").text('Billed To :', 50);
  doc.font('Helvetica-Bold').text('Pratik Kumar Rai');
  doc.font('Helvetica').fontSize(10).text('addresss');

  doc.font('Helvetica').fontSize(10).text('Addrsess', 430, 130);

  doc.end();
  console.log("PDF Created Successfully!");
});

module.exports = router;
