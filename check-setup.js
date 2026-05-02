import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 Checking Setup...\n");

let allGood = true;

// Check 1: .env file exists
console.log("1. Checking .env file...");
const envPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(envPath)) {
  console.log("   ✅ .env file exists");
  const envContent = fs.readFileSync(envPath, "utf8");
  const requiredVars = ["PORT", "MONGODB_URI", "JWT_SECRET", "JWT_REFRESH_SECRET", "ENCRYPTION_KEY"];
  const missing = requiredVars.filter(v => !envContent.includes(`${v}=`));
  if (missing.length === 0) {
    console.log("   ✅ All required variables present");
  } else {
    console.log(`   ❌ Missing variables: ${missing.join(", ")}`);
    allGood = false;
  }
} else {
  console.log("   ❌ .env file not found in backend/ folder");
  allGood = false;
}

// Check 2: Node.js version
console.log("\n2. Checking Node.js...");
try {
  const { stdout } = await execAsync("node -v");
  const version = stdout.trim();
  const majorVersion = parseInt(version.replace("v", "").split(".")[0]);
  if (majorVersion >= 18) {
    console.log(`   ✅ Node.js ${version} (OK)`);
  } else {
    console.log(`   ⚠️  Node.js ${version} (Need v18+)`);
    allGood = false;
  }
} catch (error) {
  console.log("   ❌ Node.js not found");
  allGood = false;
}

// Check 3: MongoDB
console.log("\n3. Checking MongoDB...");
try {
  const { stdout } = await execAsync("mongosh --version");
  console.log("   ✅ MongoDB shell installed");
  console.log(`   ${stdout.trim()}`);
} catch (error) {
  console.log("   ⚠️  MongoDB shell not found (might still work if MongoDB is running)");
}

// Check 4: Backend dependencies
console.log("\n4. Checking backend dependencies...");
const backendNodeModules = path.join(__dirname, "backend", "node_modules");
if (fs.existsSync(backendNodeModules)) {
  console.log("   ✅ Backend node_modules exists");
} else {
  console.log("   ❌ Backend dependencies not installed");
  console.log("   Run: cd backend && npm install");
  allGood = false;
}

// Check 5: Frontend dependencies
console.log("\n5. Checking frontend dependencies...");
const frontendNodeModules = path.join(__dirname, "frontend", "node_modules");
if (fs.existsSync(frontendNodeModules)) {
  console.log("   ✅ Frontend node_modules exists");
} else {
  console.log("   ❌ Frontend dependencies not installed");
  console.log("   Run: cd frontend && npm install");
  allGood = false;
}

// Summary
console.log("\n" + "=".repeat(50));
if (allGood) {
  console.log("✅ Setup looks good! You can run the application.");
  console.log("\nTo start:");
  console.log("  Terminal 1: cd backend && npm run dev");
  console.log("  Terminal 2: cd frontend && npm run dev");
} else {
  console.log("⚠️  Some issues found. Please fix them above.");
}
console.log("=".repeat(50));

