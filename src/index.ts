import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.set("trust proxy", 1);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", routes);
app.use(errorHandler);

app.get("/", (_req, res) => {
  res.send("Backend is running");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
