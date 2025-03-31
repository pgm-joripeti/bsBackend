import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

// Importeer routes
import authRoutes from "./routes/authRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
// import frontendRoutes from "./routes/frontendRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import dropdownRoutes from "./routes/dropdownRoutes.js";
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import teacherProfileRoutes from "./routes/teacherProfileRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import studentLeaderboardRoutes from "./routes/studentLeaderboardRoutes.js";
import teacherLeaderboardRoutes from "./routes/teacherLeaderboardRoutes.js";
import leagueRoutes from "./routes/leagueRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import studentQbitsRoutes from "./routes/studentQbitsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import rewardRoutes from "./routes/rewardRoutes.js";
import memeRoutes from "./routes/memeRoutes.js";

// nodig voor __dirname in ES modules ; we gebruiken __dirname in de server.js file om de frontend te serveren (anders moeten we live server op index.html gebruiken)
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.options("*", cors()); // ✅ Laat alle OPTIONS preflight requests toe

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173", // development met vite dev
    "http://localhost:4173", //vite preview
    "https://bs-frontend-silk.vercel.app" // productie op vercel
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // indien we met cookies zouden werken
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/stripe", webhookRoutes); // moet voor de json parser komen van express.json()

app.use(express.json());

// content security policy om images van supabase toe te staan en onze pagina's in te laden (maar geen flash of andere objecten)
// ✅ Helmet gebruiken met Content Security Policy (CSP)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Laat externe bronnen toe
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], 
        imgSrc: [
          "'self'", 
          "https://*.supabase.co", // ✅ Alle Supabase subdomeinen toestaan
          "data:", // ✅ Base64-afbeeldingen toestaan
          "blob:" // ✅ Nodig voor File API (bv. `URL.createObjectURL`)
        ],
        scriptSrc: [
          "'self'",
          "https://unpkg.com" //mathlive wel toelaten
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com" // mathlive wel toelaten
        ],        
        fontSrc: [
          "'self'", 
          "https://fonts.gstatic.com", // ✅ Google Fonts laden
          "data:" // ✅ Base64-gecodeerde fonts toestaan
        ],
        objectSrc: ["'none'"], 
        frameAncestors: ["'none'"], 
      },
    },
  })
);

// ✅ Helmet met andere beveiligingsheaders
app.use(helmet.frameguard({ action: "deny" })); // Blokkeer iframe embedding die een hacker zou kunnen gebruiken: de pagina wordt geladen in een iframe op een andere site en gebruikers klikken erop zonder het te beseffen. We noemen dit "clickjacking"
app.use(helmet.noSniff()); // Voorkom MIME-sniffing. Een hacker zou kunnen proberen een .txt als .exe te laten uitvoeren bijvoorbeeld. Dit zorgt ervoor dat bestanden enkel volgens hun formaat uitgevoerd kunnen worden
app.use(helmet.xssFilter()); // Basis XSS bescherming. Dit voorkomt dat een aanvaller javascript kan injecteren op je site

// **Statische bestanden correct serveren** NIET MEER NODIG OMDAT VITE DIT DOET
// app.use(express.static(path.join(__dirname, "../frontend")));

// **Gebruik de routes**
// app.use("/", frontendRoutes);
app.use("/api", dropdownRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/database", databaseRoutes); 
app.use("/api/quizzes", quizRoutes);
// app.use("/api/profile", profileRoutes);
app.use("/api/student/profile", studentProfileRoutes);
app.use("/api/teacher/profile", teacherProfileRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/leagues", leagueRoutes); 
app.use("/api/leaderboard/student", studentLeaderboardRoutes);
app.use("/api/leaderboard/teacher", teacherLeaderboardRoutes);
app.use("/api/supabase", uploadRoutes);
app.use("/api/student/qbits", studentQbitsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/random", memeRoutes);

// ✅ CATCH-ALL: Zorgt ervoor dat SPA-routing correct werkt bij refresh -- NIET MEER NODIG BIJ VITE
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../frontend/index.html"));
// });

// ✅ Zorg dat onbekende routes geen HTML terugsturen
app.use((req, res, next) => {
  res.status(404).json({ error: "API route niet gevonden" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server draait op http://localhost:${PORT}`));
