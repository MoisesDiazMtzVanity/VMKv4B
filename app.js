const express = require('express');
const app = express();
const reportRoutes = require('./src/routes/reportRoutes');

app.use(express.json());
app.use('/api', reportRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
