const FEED_URL = "http://clients.automanager.com/014700/inventory.xml?ID=014700&Features=1&Photos=1";

export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
if (req.method === "OPTIONS") { res.status(200).end(); return; }
try {
const response = await fetch(FEED_URL, {
headers: { "User-Agent": "Mozilla/5.0" }
});
if (!response.ok) throw new Error("Feed returned status " + response.status);
const xml = await response.text();
const vehicles = [];
const today = new Date().toISOString().split("T")[0];
const blocks = xml.match(/<Vehicle[\s\S]*?<\/Vehicle>/gi) || xml.match(/<vehicle[\s\S]*?<\/vehicle>/gi) || [];
function g(b, ...tags) {
for (const t of tags) {
const m = b.match(new RegExp("<" + t + "[^>]*>([^<]*)<\/" + t + ">", "i"));
if (m && m[1].trim()) return m[1].trim();
}
return "";
}
blocks.forEach(b => {
const vin = g(b, "VIN", "Vin", "vin");
if (!vin) return;
vehicles.push({
vin, year: parseInt(g(b, "Year", "year")) || 0,
make: g(b, "Make", "make"), model: g(b, "Model", "model"),
mileage: parseInt(g(b, "Mileage", "Miles").replace(/\D/g, "")) || 0,
stock: g(b, "StockNumber", "StockNum", "Stock"),
color: g(b, "ExteriorColor", "Color"),
createdDate: g(b, "CreatedDate", "InventoryDate") || today
});
});
if (!vehicles.length) {
res.status(200).json({ error: "No vehicles parsed", sample: xml.substring(0, 300) });
return;
}
res.status(200).json({ vehicles, total: vehicles.length });
} catch (err) {
res.status(500).json({ error: err.message });
}
}
