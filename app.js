const express = require("express");
const cors = require("cors");
const app = express();
const reportRoutes = require("./src/routes/reportRoutes");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://192.168.0.95:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api", reportRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
