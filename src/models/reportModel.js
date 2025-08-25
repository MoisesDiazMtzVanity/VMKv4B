const mysql = require("mysql2");
require("dotenv").config();
const { DateTime } = require("luxon");

const dbConfigs = {
  ecvnty: {
    host: process.env.ECVNTY_DB_HOST,
    port: process.env.ECVNTY_DB_PORT,
    database: process.env.ECVNTY_DB_DATABASE,
    user: process.env.ECVNTY_DB_USERNAME,
    password: process.env.ECVNTY_DB_PASSWORD,
  },
  proscai: {
    host: process.env.PROSCAI_DB_HOST,
    port: process.env.PROSCAI_DB_PORT,
    database: process.env.PROSCAI_DB_DATABASE,
    user: process.env.PROSCAI_DB_USERNAME,
    password: process.env.PROSCAI_DB_PASSWORD,
    ssl: { minVersion: "TLSv1.2", rejectUnauthorized: false },
  },
};

async function queryDB(config, query, params = []) {
  const connection = mysql.createConnection(config);
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) return reject(err);
      connection.query(query, params, (error, results) => {
        connection.end();
        if (error) return reject(error);
        resolve(results);
      });
    });
  });
}

module.exports = {
  getReportData: async (params) => {
    if (!(params.order_id || (params.startDate && params.endDate))) {
      throw new Error('Debes enviar ambos parámetros de fecha o el ID del Pedido.');
    }
  // Consulta en 'ecvnty' por rango de fechas o por order_id exacto
  let ecvntyQuery = `SELECT \`order\`.order_id, 
    \`order\`.invoice_no,
    \`order\`.date_added, 
    \`order\`.payment_method,
    \`order\`.email,
    \`order\`.payment_company,
    \`order\`.payment_rfc,
    \`order\`.payment_address_1,
    \`order\`.payment_address_no_ext,
    \`order\`.payment_address_no_int,
    \`order\`.payment_address_2,
    \`order\`.payment_city,
    \`order\`.payment_postcode,
    \`order\`.payment_zone,
    \`order\`.shipping_firstname,
    \`order\`.shipping_address_1,
    \`order\`.shipping_address_no_ext,
    \`order\`.shipping_address_no_int,
    \`order\`.shipping_address_2,
    \`order\`.shipping_city,
    \`order\`.shipping_postcode,
    \`order\`.shipping_zone,
    \`order\`.order_status_id, 
    \`order_product\`.model, 
    \`order_product\`.name,
    \`order_option\`.value, 
    \`order_product\`.price, 
    \`order_product\`.quantity
    FROM \`order\`
    INNER JOIN \`order_product\` ON (\`order\`.order_id = \`order_product\`.order_id)
    LEFT JOIN \`order_option\` ON (\`order_option\`.order_product_id = \`order_product\`.order_product_id)
    WHERE \`order\`.order_status_id = 2`;
    const ecvntyParams = [];
    if (params.order_id) {
      ecvntyQuery += ' AND `order`.order_id = ?';
      ecvntyParams.push(params.order_id);
    } else if (params.startDate && params.endDate) {
      ecvntyQuery += ' AND `order`.date_added BETWEEN ? AND ?';
      ecvntyParams.push(params.startDate, params.endDate);
    }
    const ecvntyResult = await queryDB(dbConfigs.ecvnty, ecvntyQuery, ecvntyParams);

    // Obtener los totales de la tabla order_total para cada order_id
    let orderTotalsMap = {};
    if (ecvntyResult && ecvntyResult.length > 0) {
      const orderIds = [...new Set(ecvntyResult.map(item => item.order_id))];
      if (orderIds.length > 0) {
        const placeholders = orderIds.map(() => '?').join(',');
        const orderTotalQuery = `SELECT * FROM order_total WHERE order_id IN (${placeholders})`;
        const orderTotalResults = await queryDB(dbConfigs.ecvnty, orderTotalQuery, orderIds);
        orderTotalResults.forEach(ot => {
          if (!orderTotalsMap[ot.order_id]) orderTotalsMap[ot.order_id] = [];
          orderTotalsMap[ot.order_id].push(ot);
        });
      }
    }

    const ordenes = {};
    
    // Crear un mapa para cachear consultas de RFC para evitar consultas duplicadas
    const rfcCache = {};
    
    for (const item of ecvntyResult) {
      // Obtener RFC para esta orden específica
      const rfc = item.payment_rfc;
      
      // Consultar datos de Proscai para este RFC específico (usar caché si ya se consultó)
      let clicod = '';
      let clinom = '';
      
      if (rfc && rfc.trim() !== '') {
        if (!rfcCache[rfc]) {
          // Consulta en 'proscai' usando el RFC obtenido
          const proscaiQuery = "SELECT fcli.clicod FROM fcli WHERE fcli.clirfc = ?";
          const proscaiResult = await queryDB(dbConfigs.proscai, proscaiQuery, [rfc]);
          
          if (proscaiResult && proscaiResult.length > 0 && proscaiResult[0].clicod) {
            rfcCache[rfc] = {
              clicod: proscaiResult[0].clicod,
              clinom: proscaiResult[0].clinom
            };
          } else {
            rfcCache[rfc] = {
              clicod: ''
            };
          }
        }
        
        clicod = rfcCache[rfc].clicod;
        clinom = rfcCache[rfc].clinom;
      }
      
      let formattedDate = null;
      if (item.date_added) {
        let dt;
        if (
          typeof item.date_added === "string" &&
          item.date_added.includes("T")
        ) {
          dt = DateTime.fromISO(item.date_added, { zone: "utc" });
        } else if (typeof item.date_added === "string") {
          dt = DateTime.fromSQL(item.date_added, { zone: "utc" });
        } else {
          dt = DateTime.fromJSDate(item.date_added, { zone: "utc" });
        }
        formattedDate = dt.isValid
          ? dt.setZone("America/Mexico_City").toFormat("yyyy-MM-dd HH:mm:ss")
          : null;
      }
      const keyOrd = `${item.order_id}_${item.invoice_no}_${formattedDate}`;
      if (!ordenes[keyOrd]) {
        const payment = [
          {
            payment_company: item.payment_company,
            payment_rfc: item.payment_rfc,
            payment_address_1: item.payment_address_1,
            payment_address_no_ext: item.payment_address_no_ext,
            payment_address_no_int: item.payment_address_no_int,
            payment_address_2: item.payment_address_2,
            payment_city: item.payment_city,
            payment_postcode: item.payment_postcode,
            payment_zone: item.payment_zone,
            payment_country: item.payment_country,
          },
        ];
        const shipping = [
          {
            shipping_firstname: item.shipping_firstname,
            shipping_address_1: item.shipping_address_1,
            shipping_address_no_ext: item.shipping_address_no_ext,
            shipping_address_no_int: item.shipping_address_no_int,
            shipping_address_2: item.shipping_address_2,
            shipping_city: item.shipping_city,
            shipping_postcode: item.shipping_postcode,
            shipping_zone: item.shipping_zone,
            shipping_country: item.shipping_country,
          },
        ];
        ordenes[keyOrd] = {
          clicod,
          order_id: item.order_id,
          invoice_no: item.invoice_no,
          date_added: formattedDate,
          email: item.email,
          payment_method: item.payment_method,
          productos: [],
          payment,
          shipping,
          total: Number(item.total).toFixed(2),
          order_total: orderTotalsMap[item.order_id] || []
        };
      }
      ordenes[keyOrd].productos.push({
        model: item.model,
        name: item.name,
        value: item.value,
        price: Number(item.price).toFixed(2),
        quantity: item.quantity,
        total: Number(item.total).toFixed(2),
      });
    }

    return {
      ecvnty: Object.values(ordenes),
    };
  },
};
