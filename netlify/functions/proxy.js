const FEED_URL = "https://clients.automanager.com/2d959d0cddca482ca29ed95900a4f9f2/inventory.xml?ID=&Features=1&Photos=1";

exports.handler = async function(event) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Fetch the XML feed directly from the server
    const res = await fetch(FEED_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IAO-Inspector/1.0)" }
    });

    if (!res.ok) throw new Error(`Feed returned status ${res.status}`);
    const xml = await res.text();

    // Parse XML into vehicle objects
    const vehicles = [];
    const today = new Date().toISOString().split("T")[0];

    // Match all Vehicle blocks
    const vehicleBlocks = xml.match(/<Vehicle[\s\S]*?<\/Vehicle>/gi) || 
                          xml.match(/<vehicle[\s\S]*?<\/vehicle>/gi) ||
                          xml.match(/<item[\s\S]*?<\/item>/gi) || [];

    function getTag(block, ...tags) {
      for (const tag of tags) {
        const m = block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"));
        if (m && m[1].trim()) return m[1].trim();
      }
      return "";
    }

    vehicleBlocks.forEach(block => {
      const vin = getTag(block, "VIN", "Vin", "vin");
      if (!vin) return;
      const mil = getTag(block, "Mileage", "Miles", "Odometer", "mileage");
      const yr  = getTag(block, "Year", "year", "ModelYear");
      vehicles.push({
        vin,
        year:      parseInt(yr) || 0,
        make:      getTag(block, "Make", "make"),
        model:     getTag(block, "Model", "model"),
        mileage:   parseInt(mil.replace(/\D/g, "")) || 0,
        stock:     getTag(block, "StockNumber", "StockNum", "Stock", "stock"),
        color:     getTag(block, "ExteriorColor", "Color", "color", "colour"),
        createdDate: getTag(block, "CreatedDate", "InventoryDate", "DateAdded") || today
      });
    });

    if (!vehicles.length) {
      // Return raw XML snippet for debugging
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          error: "No vehicles parsed", 
          sample: xml.substring(0, 500),
          totalLength: xml.length
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ vehicles, total: vehicles.length })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
proxy v2.js
Displaying proxy v2.js.
