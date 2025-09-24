import jsPDF from "jspdf";
import "jspdf-autotable";

export function BillPDFButton({ transactions, summary }) {
  function generate() {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Finance Tracker - Statement Summary", 14, 18);

    doc.setFontSize(11);
    doc.text(`Total Income: $${summary.income.toFixed(2)}`, 14, 28);
    doc.text(`Total Expenses: $${summary.expenses.toFixed(2)}`, 14, 34);
    doc.text(`Net Balance: $${summary.net.toFixed(2)}`, 14, 40);

    const rows = transactions.map((t) => [
      t.date,
      t.description,
      t.merchant || "-",
      (t.amount < 0 ? "-" : "") + "$" + Math.abs(t.amount).toFixed(2),
      t.category || "-",
    ]);

    doc.autoTable({
      startY: 50,
      head: [["Date", "Description", "Merchant", "Amount", "Category"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [14, 165, 233] },
    });

    doc.save("statement.pdf");
  }

  return (
    <button
      onClick={generate}
      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50"
    >
      Download PDF
    </button>
  );
}








