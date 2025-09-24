import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
// Import pdf-parse dynamically to avoid initialization errors
let pdfParse;
try {
  pdfParse = (await import("pdf-parse")).default;
} catch (error) {
  console.warn("Warning: pdf-parse module could not be loaded properly");
  pdfParse = null;
}
import { parse as csvParse } from "csv-parse";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";
// Import routes
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Mock data storage - starts empty
const mockTransactions = [];

const mockUsers = [
  {
    _id: "u1",
    name: "Demo User",
    email: "demo@example.com",
    password: "password123",
  },
];

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and configure multer
const uploadDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("Warning: failed to ensure uploads directory", err?.message);
}
const upload = multer({ dest: uploadDir });

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/parse", upload.array("files"), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ error: "No files uploaded" });

    const allText = [];

    for (const f of files) {
      // Resolve absolute file path produced by multer
      const full = path.isAbsolute(f.path)
        ? f.path
        : path.join(uploadDir, f.filename || f.path);
      const ext = (f.originalname.split(".").pop() || "").toLowerCase();
      if (ext === "pdf") {
        if (pdfParse) {
          try {
            const data = await pdfParse(fs.readFileSync(full));
            allText.push(data.text);
          } catch (error) {
            console.error(`Error parsing PDF file: ${f.originalname}`, error);
            allText.push(`[Failed to parse PDF: ${f.originalname}]`);
          }
        } else {
          console.warn(
            `PDF parsing not available, skipping file: ${f.originalname}`
          );
          allText.push(`[PDF parsing not available: ${f.originalname}]`);
        }
      } else if (ext === "csv") {
        try {
          const csv = await readCsv(full);
          allText.push(csv);
        } catch (error) {
          console.error(`Error reading CSV file: ${f.originalname}`, error);
          allText.push(`[Failed to read CSV: ${f.originalname}]`);
        }
      } else if (ext === "txt") {
        try {
          allText.push(fs.readFileSync(full, "utf8"));
        } catch (error) {
          console.error(`Error reading TXT file: ${f.originalname}`, error);
          allText.push(`[Failed to read TXT: ${f.originalname}]`);
        }
      }
      // Best-effort cleanup; ignore errors
      fs.unlink(full, () => {});
    }

    const joined = allText.join("\n\n");

    let transactions = [];
    if (openai) {
      try {
        const system =
          "You extract bank transactions as JSON array with fields: date (YYYY-MM-DD), amount (number, negative for expenses), description, merchant, category (one of: Groceries, Utilities, Food & Drink, Transport, Entertainment, Housing, Salary, Investments, Transfers, Other). Ensure valid JSON only.";
        const user = `Bank statement content:\n\n${truncate(
          joined,
          12000
        )}\n\nReturn JSON only.`;
        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0,
        });
        const text = resp.choices?.[0]?.message?.content || "[]";
        transactions = safeJson(text);
        console.log("Successfully parsed transactions with OpenAI");
      } catch (error) {
        console.error("Error using OpenAI API:", error.message);
        console.log("Falling back to heuristic parser");
        transactions = heuristicParse(joined);
      }
    } else {
      transactions = heuristicParse(joined);
    }

    // Add user ID to transactions if authenticated
    if (req.user) {
      transactions = transactions.map((t) => ({ ...t, user: req.user._id }));
    }

    // Use mock data instead of MongoDB
    if (transactions.length > 0) {
      const savedTransactions = transactions.map((t, i) => ({
        _id: `t${Date.now()}-${i}`,
        ...t,
      }));

      // Replace existing transactions with the newly parsed set
      mockTransactions.length = 0;
      mockTransactions.push(...savedTransactions);

      return res.json({ transactions: savedTransactions });
    }

    return res.json({ transactions });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to parse" });
  }
});

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csvParse({ columns: true, skip_empty_lines: true }))
      .on("data", (row) => rows.push(row))
      .on("end", () =>
        resolve(rows.map((r) => Object.values(r).join(" ")).join("\n"))
      )
      .on("error", reject);
  });
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) : str;
}

function safeJson(text) {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
}

function categorizeTransaction(description, amount) {
  const desc = description.toLowerCase();

  // Income categories
  if (amount >= 0) {
    if (
      desc.includes("salary") ||
      desc.includes("payroll") ||
      desc.includes("wage")
    )
      return "Salary";
    if (desc.includes("bonus") || desc.includes("commission")) return "Salary";
    if (desc.includes("refund") || desc.includes("return")) return "Transfers";
    if (
      desc.includes("investment") ||
      desc.includes("dividend") ||
      desc.includes("interest")
    )
      return "Investments";
    return "Salary"; // Default for positive amounts
  }

  // Expense categories
  if (
    desc.includes("grocery") ||
    desc.includes("food") ||
    desc.includes("supermarket") ||
    desc.includes("market")
  )
    return "Groceries";
  if (
    desc.includes("restaurant") ||
    desc.includes("cafe") ||
    desc.includes("coffee") ||
    desc.includes("dining")
  )
    return "Food & Drink";
  if (
    desc.includes("electric") ||
    desc.includes("gas") ||
    desc.includes("water") ||
    desc.includes("utility") ||
    desc.includes("internet") ||
    desc.includes("phone")
  )
    return "Utilities";
  if (
    desc.includes("rent") ||
    desc.includes("mortgage") ||
    desc.includes("housing") ||
    desc.includes("apartment")
  )
    return "Housing";
  if (
    desc.includes("car") ||
    desc.includes("gas") ||
    desc.includes("fuel") ||
    desc.includes("parking") ||
    desc.includes("uber") ||
    desc.includes("taxi") ||
    desc.includes("transport")
  )
    return "Transport";
  if (
    desc.includes("movie") ||
    desc.includes("entertainment") ||
    desc.includes("game") ||
    desc.includes("netflix") ||
    desc.includes("streaming")
  )
    return "Entertainment";
  if (
    desc.includes("medical") ||
    desc.includes("doctor") ||
    desc.includes("hospital") ||
    desc.includes("pharmacy")
  )
    return "Other";
  if (
    desc.includes("insurance") ||
    desc.includes("bank") ||
    desc.includes("fee") ||
    desc.includes("charge")
  )
    return "Other";

  return "Other";
}

function heuristicParse(text) {
  const lines = text.split(/\r?\n/);
  const tx = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: YYYY-MM-DD Description Amount
    let m = trimmed.match(/(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?\d+[\.,]?\d*)/);
    if (m) {
      const amount = parseFloat(m[3].replace(",", ""));
      const description = m[2].trim();
      tx.push({
        date: m[1],
        description,
        merchant: description,
        amount,
        category: categorizeTransaction(description, amount),
      });
      continue;
    }

    // Pattern 2: MM/DD/YYYY Description Amount
    m = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+[\.,]?\d*)/);
    if (m) {
      const [month, day, year] = m[1].split("/");
      const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      const amount = parseFloat(m[3].replace(",", ""));
      const description = m[2].trim();
      tx.push({
        date,
        description,
        merchant: description,
        amount,
        category: categorizeTransaction(description, amount),
      });
      continue;
    }

    // Pattern 3: DD/MM/YYYY Description Amount
    m = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(-?\d+[\.,]?\d*)/);
    if (m) {
      const [day, month, year] = m[1].split("/");
      const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      const amount = parseFloat(m[3].replace(",", ""));
      const description = m[2].trim();
      tx.push({
        date,
        description,
        merchant: description,
        amount,
        category: categorizeTransaction(description, amount),
      });
      continue;
    }

    // Pattern 4: Amount at start: -$123.45 Description Date
    m = trimmed.match(
      /^(-?\$?\d+[\.,]?\d*)\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/
    );
    if (m) {
      let amount = parseFloat(m[1].replace(/[$,]/g, ""));
      if (m[1].startsWith("-")) amount = -Math.abs(amount);
      const dateStr = m[3];
      let date;
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          date = dateStr.replace(/\//g, "-");
        } else {
          // MM/DD/YYYY
          const [month, day, year] = parts;
          date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      } else {
        date = dateStr;
      }
      const description = m[2].trim();
      tx.push({
        date,
        description,
        merchant: description,
        amount,
        category: categorizeTransaction(description, amount),
      });
      continue;
    }

    // Pattern 5: Look for any line with a recognizable amount pattern
    m = trimmed.match(/(.+?)\s+(-?\$?\d+[\.,]?\d*)\s*$/);
    if (m) {
      const amount = parseFloat(m[2].replace(/[$,]/g, ""));
      if (!isNaN(amount) && Math.abs(amount) > 0.01) {
        // Try to extract date from description
        const desc = m[1].trim();
        const dateMatch = desc.match(
          /(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/
        );
        let date = new Date().toISOString().split("T")[0]; // fallback to today
        if (dateMatch) {
          const dateStr = dateMatch[1];
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts[0].length === 4) {
              date = dateStr.replace(/\//g, "-");
            } else {
              const [month, day, year] = parts;
              date = `${year}-${month.padStart(2, "0")}-${day.padStart(
                2,
                "0"
              )}`;
            }
          } else {
            date = dateStr;
          }
        }
        tx.push({
          date,
          description: desc,
          merchant: desc,
          amount,
          category: categorizeTransaction(desc, amount),
        });
      }
    }
  }

  return tx;
}

// Mock database connection for demo
console.log("Using mock data instead of MongoDB");

// API Routes
// Mock API endpoints for transactions
app.get("/api/transactions", (req, res) => {
  res.json(mockTransactions);
});

app.post("/api/transactions", (req, res) => {
  const newTransaction = {
    _id: `t${Date.now()}`,
    ...req.body,
  };
  mockTransactions.unshift(newTransaction);
  res.status(201).json(newTransaction);
});

app.put("/api/transactions/:id", (req, res) => {
  const index = mockTransactions.findIndex((t) => t._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  mockTransactions[index] = { ...mockTransactions[index], ...req.body };
  res.json(mockTransactions[index]);
});

app.delete("/api/transactions/:id", (req, res) => {
  const index = mockTransactions.findIndex((t) => t._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  mockTransactions.splice(index, 1);
  res.status(204).send();
});

app.post("/api/transactions/batch", (req, res) => {
  const newTransactions = (req.body.transactions || []).map((t, i) => ({
    _id: `t${Date.now()}-${i}`,
    ...t,
  }));
  // Replace existing transactions with uploaded batch
  mockTransactions.length = 0;
  mockTransactions.push(...newTransactions);
  res.status(201).json(newTransactions);
});

// Mock API endpoints for users
app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: "mock-jwt-token",
  });
});

app.post("/api/users", (req, res) => {
  const { name, email, password } = req.body;

  if (mockUsers.some((u) => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser = {
    _id: `u${Date.now()}`,
    name,
    email,
    password,
  };

  mockUsers.push(newUser);

  res.status(201).json({
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    token: "mock-jwt-token",
  });
});

app.get("/api/users/profile", (req, res) => {
  // In a real app, we would verify the JWT token
  // For demo, just return the first user
  const user = mockUsers[0];

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);
