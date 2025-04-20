const express = require("express");
const router = express.Router();
const fs = require("node:fs");
const { db } = require("../firebase");
const { ToWords } = require("to-words");
const { auth } = require("../firebase-client");
const { signInWithEmailAndPassword } = require("firebase/auth");
const { createConnection } = require("../astra-conn");
const dotenv = require("dotenv");
dotenv.config();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express is live" });
});

router.get("/create-table", async (req, res, next) => {
  createConnection()
    .connect()
    .then(async () => {
      createConnection()
        .execute(
          `
      CREATE TABLE IF NOT EXISTS ${process.env.ASTRA_DB_KEYSPACE}.customer_invoices (id BIGINT PRIMARY KEY, addressline1 TEXT, addressline2 TEXT, city TEXT, createDate TEXT, customerName TEXT, discount TEXT, gst TEXT, hns BIGINT, invoiceDate TEXT,
      invoiceNumber TEXT, isKit BOOLEAN , phone TEXT, pin TEXT, productName TEXT, purchasedPrice TEXT, quantity BIGINT, sellingPrice BIGINT, serialNumber TEXT,
      serialNumberLeft TEXT, serialNumberRight TEXT, sophecoAddress TEXT, state TEXT, totalAmount BIGINT, warranty BIGINT);
    `
        )
        .then(() => res.send("SUCCESS"))
        .catch((error) => res.status(500).send({ error }));
    })
    .catch((error) => res.send({ error }));
});

/**
 * user signin with email/password
 */
router.post("/auth-user", (req, res, next) => {
  const { email, password } = req.body;
  signInWithEmailAndPassword(auth, email, password)
    .then((signinData) => {
      const user = signinData.user.toJSON();
      res.send(user);
    })
    .catch((error) => {
      const errObj = {
        validUser: false,
        status: 404,
        error,
      };
      res.status(404).send(errObj);
    });
});

/**
 * check current user session
 */
router.get("/check-session", async (req, res, next) => {
  try {
    auth.currentUser
      .getIdToken()
      .then((userSession) => {
        res.send({ token: userSession });
      })
      .catch((error) => {
        res.status(401).send({ token: null, error });
      });
  } catch (error) {
    res.status(401).send({ token: null, error });
  }
});

/**
 * log out user
 */
router.get("/log-out", (req, res, next) => {
  try {
    auth
      .signOut()
      .then((s) => {
        res.send(true);
      })
      .catch((error) => {
        res.status(401).send({ token: null, error });
      });
  } catch (error) {
    res.status(401).send({ token: null, error });
  }
});

/**
 * get invoices
 */
router.post("/get-invoices", async (req, res, next) => {
  const { searchStr, limit } = req.body;
  const invoiceref = await db.collection("invoice");
  try {
    if (searchStr) {
      invoiceref
        .orderBy("customerName")
        .where("filterFields", "array-contains-any", [searchStr])
        .limit(limit)
        .get()
        .then((data) => {
          if (data.empty) {
            res.send([]);
          } else {
            const docObj = {
              invoiceList: data.docs.map((d) => d.data()),
              size: data.size,
            };
            res.send(docObj);
          }
        });
    } else {
      invoiceref
        .orderBy("customerName")
        .limit(limit)
        .get()
        .then((data) => {
          if (data.empty) {
            res.send([]);
          } else {
            const docObj = {
              invoiceList: data.docs.map((d) => d.data()),
              size: data.size,
            };
            res.send(docObj);
          }
        });
    }
  } catch (error) {
    res.status(500);
  }
});

/**
 * save and download invoice
 */
router.post("/download-invoice", async (req, res, next) => {
  if (auth.currentUser) {
    const createDate = getDate();
    const invoiceDate = getDate(req.body.invoiceDate);
    const invoiceData = {
      ...req.body,
      createDate,
      invoiceDate,
      id: Math.floor(
        1000 + Math.random() * 9000
      ),
    };
    try {
      //const colRef = await db.collection("invoice").add(invoiceData);
      const query = `INSERT INTO ${process.env.ASTRA_DB_KEYSPACE}.${process.env.ASTRA_DB_TABLE} (id, addressline1, addressline2, city, createDate, customerName, discount, gst, hns, invoiceDate,
      invoiceNumber, isKit , phone, pin, productName, purchasedPrice, quantity, sellingPrice, serialNumber , serialNumberLeft, serialNumberRight, sophecoAddress, state, totalAmount, warranty) VALUES (${invoiceData.id}, 
      '${invoiceData.addressline1}', '${invoiceData.addressline2}', '${invoiceData.city}', '${invoiceData.createDate}', '${invoiceData.customerName}',
      '${invoiceData.discount}', '${invoiceData.gst}', ${invoiceData.hns}, '${invoiceData.invoiceDate}', '${invoiceData.invoiceNumber}', ${invoiceData.isKit}, '${invoiceData.phone}', 
      '${invoiceData.pin}', '${invoiceData.productName}', '${invoiceData.purchasedPrice}', ${invoiceData.quantity}, ${invoiceData.sellingPrice}, '${invoiceData.serialNumber}', 
      '${invoiceData.serialNumberLeft}', '${invoiceData.serialNumberRight}', '${invoiceData.sophecoAddress}', '${invoiceData.state}', ${invoiceData.totalAmount}, ${invoiceData.warranty})`;
      createConnection()
        .execute(query)
        .then(() => {
          // pdf creation
          const PDFDocument = require("pdfkit-table");
          const doc = new PDFDocument({ size: "A4", margin: 0 });
          doc.registerFont("DejaVuSans", "public/DejaVuSans.ttf");

          // Output file
          const stream = fs.createWriteStream("public/output.pdf");
          doc.pipe(stream);

          // Dark Purple Left Section
          doc.rect(0, 0, 249, 30).fill("#2E0052");

          // White Slant Divider
          doc
            .moveTo(250, 0)
            .lineTo(210, 30)
            .lineTo(250, 30)
            .fillAndStroke("white");

          doc.moveTo(260, 0).lineTo(240, 15).lineTo(270, 15).fill("#3A5ADB");

          // Blue Section
          doc.rect(260, 0, 866, 15).fill("#3A5ADB");
          doc
            .font("Helvetica-Bold")
            .text(`GST NO - ${invoiceData.gst}`, 20, 40);

          doc.moveDown();
          doc
            .image("public/logo.png", 470, 30, { width: 100, height: 74 })
            .moveDown();

          doc
            .font("Helvetica-Bold")
            .fillColor("#4A148C")
            .text(
              "SOLUTION FOR POWERFUL HEARING AND COMMUNICATION",
              220,
              110,
              {}
            )
            .moveDown();

          doc.font("Helvetica").fillColor("black").text("Billed To :", 20);
          doc.font("Helvetica-Bold").text(invoiceData.customerName);
          doc.font("Helvetica").fontSize(10).text(invoiceData.addressline1);
          if (invoiceData.addressline2) {
            doc.font("Helvetica").fontSize(10).text(invoiceData.addressline2);
          }
          doc
            .font("Helvetica")
            .fontSize(10)
            .text(
              `${invoiceData.city}, ${invoiceData.state} - ${invoiceData.pin}`
            );
          if (invoiceData.phone) {
            doc.font("Helvetica").fontSize(10).text(`+91-${invoiceData.phone}`);
          }
          doc
            .font("Helvetica")
            .fontSize(10)
            .text(getAddress(invoiceData.sophecoAddress), 280, 130, {
              width: 300,
              align: "right",
            });

          doc
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(invoiceData.invoiceNumber, 500, 200);
          doc.font("Helvetica-Bold").fontSize(11).text(invoiceDate, 516, 212);

          doc.font("Helvetica").fontSize(12).text("", 20, 250);

          const table = {
            headers: getHeaders(),
            datas: getRowData(invoiceData),
          };

          doc.table(table, {
            prepareHeader: () =>
              doc.font("Helvetica-Bold").fontSize(12).fillColor("white"),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
              doc.font("Helvetica").fontSize(12).fillColor("black");
            },
            width: 800,
            padding: 15,
            divider: {
              header: { disabled: true },
              horizontal: { disabled: true, width: 0.1, opacity: 1 },
              vertical: { width: 1, opacity: 1 },
            },
          });
          doc
            .font("Helvetica")
            .fontSize(10)
            .text("Amount chargeable (in words)", 30, 600);
          doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(`INR ${toWords(+invoiceData.totalAmount)}`, { width: 400 });
          doc
            .font("Helvetica-Bold")
            .fontSize(15)
            .text("SOPHECO PRIVATE LIMITED.", 30, 660);
          doc.font("Helvetica").fontSize(15).text("Company's PAN: ABMCS2566D");
          doc
            .font("Helvetica")
            .fontSize(10)
            .text(
              `We declare that this invoice shows the actual price of the goods\ndescribed and that all particulars are true and correct\n1) 100% payment against delivery\n2) delivery within 3 working days after making payment\n`,
              30,
              700
            );
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(`*Terms and conditions apply`);
          doc.image("public/sign.png", 380, 590, { width: 200, height: 184 });
          doc.fontSize(10).text("Contact No:- (+91-9006164420)", 410, 780);
          // total border
          doc
            .moveTo(570, 560)
            .lineTo(30, 560)
            .strokeOpacity(0.5)
            .strokeColor("black");
          doc
            .moveTo(570, 590)
            .lineTo(30, 590)
            .strokeOpacity(0.5)
            .strokeColor("black");
          // total border

          //row border
          doc
            .moveTo(430, 560)
            .lineTo(430, 280)
            .strokeOpacity(0.5)
            .strokeColor("black");
          doc
            .moveTo(350, 560)
            .lineTo(350, 280)
            .strokeOpacity(0.5)
            .strokeColor("black");
          doc
            .moveTo(300, 560)
            .lineTo(300, 280)
            .strokeOpacity(0.5)
            .strokeColor("black");
          doc
            .moveTo(220, 560)
            .lineTo(220, 280)
            .strokeOpacity(0.5)
            .strokeColor("black");
          doc.stroke();
          //row border
          res.attachment(
            `${invoiceData.customerName.replaceAll(
              " ",
              "_"
            )}${invoiceData.invoiceNumber.replaceAll("/", "_")}.pdf`
          );
          doc.pipe(res);
          doc.end();
        })
        .catch((error) => res.status(500).send(error));
    } catch (error) {
      res.status(500).json({
        message: "Error while creating invoice",
        error: error.message,
      });
    }
  } else {
    res.status(401);
  }
});

const getDate = (date) => {
  const dt = date ? new Date(date) : new Date(Date.now());
  return `${("0" + dt.getDate()).slice(-2)}/${("0" + (dt.getMonth() + 1)).slice(
    -2
  )}/${dt.getFullYear()}`;
};

const getAddress = (state) => {
  let retVal = "";
  if (state.toLowerCase() === "mumbai") {
    retVal = `SHOP NO. 115, CITY MALL, NEW LINK RD., PHASE\nD, SHASTRI NAGAR, ANDHERI WEST, MUMBAI,\nMAHARASHTRA 400102`;
  } else if (state.toLowerCase() === "bihar") {
    retVal = `KALI ASTHAN CHOWK, INFRONT OF PANI TANKI\nZOOM STUDIO ROAD, FIRST FLOOR,\nBEGUSARAI, BIHAR 851101`;
  } else {
    retVal = `SHOP NO. 332, BASMENT ZAKIR NAGAR, NEW FRIENDS\nD COLONY, NEXT TO JAMIA BANK\nZAKIR NAGAR DELHI 110025`;
  }
  return retVal;
};

const getHeaderDefFirst = () => {
  return {
    renderer: null,
    headerColor: "#2E0052",
    headerOpacity: 1,
    valign: "center",
    columnColor: "red",
    columnOpacity: 0.5,
    options: { separation: true },
  };
};

const getHeaderDefRest = () => {
  return {
    renderer: null,
    headerColor: "#3A5ADB",
    headerOpacity: 1,
    valign: "center",
    columnColor: "#cccccc",
    columnOpacity: 0.5,
    options: { separation: true },
  };
};

const getHeaders = () => {
  return [
    {
      label: "ITEM DESCRIPTION",
      property: "desc",
      width: 200,
      ...getHeaderDefFirst(),
    },
    {
      label: "HNS/SAC",
      property: "hns",
      width: 80,
      ...getHeaderDefRest(),
    },
    { label: "QTY", property: "qty", width: 50, ...getHeaderDefRest() },
    { label: "GST", property: "gst", width: 80, ...getHeaderDefRest() },
    { label: "TOTAL", property: "total", width: 150, ...getHeaderDefRest() },
  ];
};

const getRowData = (data) => {
  return [
    {
      desc: {
        label: data.productName,
        options: {
          fontSize: 12,
          fontFamily: "Helvetica-Bold",
          separation: true,
        },
      },
      hns: data.hns,
      qty: data.quantity,
      gst: "",
      total: {
        label: `₹${(+data.sellingPrice + 0.0).toLocaleString("en-IN")}.00`,
        options: { fontFamily: "DejaVuSans" },
      },
    },
    {
      desc: {
        label: getSerialNo(
          data.isKit,
          data.serialNumber,
          data.serialNumberLeft,
          data.serialNumberRight,
          data.warranty
        ),
        options: { fontFamily: "Helvetica-Oblique" },
      },
      qty: "",
      gst: "",
      total: "",
    },
    {
      desc: { label: "CHARGER", options: { fontFamily: "Helvetica-Bold" } },
      qty: "",
      gst: "",
      total: "",
    },
    {
      desc: {
        label: "*1 year warranty",
        options: { fontFamily: "Helvetica-Oblique" },
      },
      qty: "",
      gst: "",
      total: "",
    },
    {
      desc: "",
      qty: "",
      gst: "",
      total: "",
    },
    {
      desc: {
        label: "Rebate & Discount. IGST\nExempted",
        options: { fontFamily: "Helvetica-Bold" },
      },
      qty: "",
      gst: "cgst 0%\nsgst 0%",
      total: {
        label: getDiscountedPrice(data.sellingPrice, data.totalAmount),
        options: { fontFamily: "DejaVuSans" },
      },
    },
    {
      desc: "",
      qty: "",
      gst: "",
      total: "",
    },
    {
      desc: "",
      qty: "",
      gst: "",
      total: {
        label: `\n\n\n₹${(+data.totalAmount + 0.0).toLocaleString("en-IN")}.00`,
        options: { fontFamily: "DejaVuSans" },
      },
    },
  ];
};

const getSerialNo = (isKit, sl, sll, slr, warranty) => {
  if (isKit) {
    return `SL NO.\n${sll}\n${slr}\n*${warranty} years warranty`;
  }
  return `SL NO.\n${sl}\n*${warranty} years warranty`;
};

const getDiscountedPrice = (selling, total) => {
  const discountPrice = "" + (selling - total);
  return `(-)₹${(+discountPrice + 0.0).toLocaleString("en-IN")}.00`;
};

const toWords = (amount) => {
  const toWords = new ToWords();
  return toWords.convert(amount, { currency: true });
};

module.exports = router;
