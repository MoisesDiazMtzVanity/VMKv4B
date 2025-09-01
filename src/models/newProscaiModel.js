const mysql = require("mysql2");
require("dotenv").config();

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

async function getInvoiceUsersWithClicod(fechaInicio, fechaFinal) {
	// Consulta los registros de la primera base
	const newProscai = `
		SELECT 
			\`order\`.payment_company AS razon_social, 
			\`order\`.payment_address_1 AS calle, 
			\`order\`.payment_address_no_ext AS no_ext,
			\`order\`.payment_address_no_int AS no_int, 
			\`order\`.payment_address_2 AS colonia, 
			\`order\`.payment_city AS alc_mnpo, 
			\`order\`.payment_zone AS estado,
			\`order\`.payment_postcode AS cp, 
			\`order\`.payment_country AS pais, 
			\`order\`.payment_rfc AS rfc, 
			\`customer\`.email AS email, 
			\`order\`.payment_tax_regime AS regime
		FROM \`order\`
		INNER JOIN \`customer\` ON (\`customer\`.customer_id = \`order\`.customer_id)
		WHERE \`order\`.order_status_id = 2 
			AND \`order\`.payment_invoice_required = 1 
			AND DATE(\`order\`.date_added) >= ? 
			AND DATE(\`order\`.date_added) <= ?
	`;

	// Consulta todos los fcli de proscai
	const proscaiQuery = 'SELECT fcli.clicod, fcli.clirfc FROM fcli';

	// Ejecutar ambas consultas en paralelo usando dbConfigs
	const [users, fcliRows] = await Promise.all([
		new Promise((resolve, reject) => {
			const connection = mysql.createConnection(dbConfigs.ecvnty);
			connection.connect((err) => {
				if (err) return reject(err);
				connection.query(newProscai, [fechaInicio, fechaFinal], (error, results) => {
					connection.end();
					if (error) return reject(error);
					resolve(results);
				});
			});
		}),
		new Promise((resolve, reject) => {
			const connection = mysql.createConnection(dbConfigs.proscai);
			connection.connect((err) => {
				if (err) return reject(err);
				connection.query(proscaiQuery, (error, results) => {
					connection.end();
					if (error) return reject(error);
					resolve(results);
				});
			});
		})
	]);

	// Crear un mapa de RFC a clicod
	const rfcToClicod = {};
	let maxClicod = 0;
	fcliRows.forEach(row => {
		rfcToClicod[row.clirfc] = rfcToClicod[row.clirfc] || [];
		rfcToClicod[row.clirfc].push(row.clicod);
		// Buscar el mayor clicod
		const num = parseInt(row.clicod.replace(/[^0-9]/g, ''));
		if (!isNaN(num) && num > maxClicod) maxClicod = num;
	});

	// Separar en dos listas: nuevos y existentes
	const nuevos = [];
	const existentes = [];
	users.forEach(user => {
		const rfc = user.rfc;
		let clicod = null;
		let tipo = '';
		if (rfc && rfcToClicod[rfc]) {
			// Si hay varios, tomar el mayor
			const max = rfcToClicod[rfc].reduce((a, b) => {
				const na = parseInt(a.replace(/[^0-9]/g, ''));
				const nb = parseInt(b.replace(/[^0-9]/g, ''));
				return (na > nb) ? a : b;
			});
			clicod = max;
			tipo = 'existente';
			existentes.push({ ...user, clicod });
		} else {
			// Si no existe, asignar el siguiente clicod
			clicod = `{${maxClicod + 1}`;
			tipo = 'nuevo';
			nuevos.push({ ...user, clicod });
		}
	});
	return { nuevos, existentes };
}

module.exports = {
	getInvoiceUsersWithClicod,
};
