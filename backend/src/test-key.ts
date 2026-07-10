import dotenv from "dotenv";
dotenv.config();

const key = process.env.GEMINI_API_KEY || "";
const maskedKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : "None";

console.log(`🔍 Diagnosing API Key: ${maskedKey}`);

async function testModels() {
  if (!key) {
    console.error("❌ Error: GEMINI_API_KEY is empty in .env");
    return;
  }
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log(`Sending GET request to Google Generative Language API...`);
    
    const response = await fetch(url);
    const data = (await response.json()) as any;
    
    if (response.ok) {
      console.log("✅ Success! Your API key is valid.");
      console.log("Here is a list of models your key has access to:");
      if (data.models && Array.isArray(data.models)) {
        data.models.slice(0, 5).forEach((m: any) => {
          console.log(`  - ${m.name} (${m.displayName})`);
        });
        if (data.models.length > 5) {
          console.log(`  ... and ${data.models.length - 5} more models.`);
        }
      } else {
        console.log(data);
      }
    } else {
      console.log("❌ API Response Error details:");
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error("❌ Network or request error:", error.message || error);
  }
}

testModels();
