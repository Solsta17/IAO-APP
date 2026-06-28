const FEED_URL = "https://clients.automanager.com/2d959d0cddca482ca29ed95900a4f9f2/inventory.xml?ID=&Features=1&Photos=1";

exports.handler = async function(event) {
const headers = {
"Content-Type": "application/json",
"Access-Control-Allow-Origin": "*"
};
if (event.httpMethod === "OPTIONS") {
return { statusCode: 200, headers, body: "" };
}
try {
const res = await fetch(FEED_URL, {
headers: { "User-Agent": "Mozilla/5.0" }
});
if (!res.ok) throw new Error("Feed returned status " + res.status);
const xml = await res.text();
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
vin,
year: parseInt(g(b, "Year", "year")) || 0,
make: g(b, "Make", "make"),
model: g(b, "Model", "model"),
mileage: parseInt(g(b, "Mileage", "Miles", "Odometer").replace(/\D/g, "")) || 0,
stock: g(b, "StockNumber", "StockNum", "Stock", "stock"),
color: g(b, "ExteriorColor", "Color", "color"),
createdDate: g(b, "CreatedDate", "InventoryDate") || today
});
});
if (!vehicles.length) {
return { statusCode: 200, headers, body: JSON.stringify({ error: "No vehicles parsed", sample: xml.substring(0, 300) }) };
}
return { statusCode: 200, headers, body: JSON.stringify({ vehicles, total: vehicles.length }) };
} catch (err) {
return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
}
};
