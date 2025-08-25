const PDFDocument = require("pdfkit");
const ReportModel = require("../models/reportModel");

// Función helper para formatear números con separadores de miles
const formatCurrency = (number) => {
  return parseFloat(number).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

exports.downloadReportPDF = async (req, res) => {
  const order_id = req.query.idPedido;
  const startDate = req.query.fechaInicio;
  const endDate = req.query.fechaFinal;
  // Definir nombre de archivo según la fecha enviada
  let nombreArchivo = 'orden.pdf';
  if (startDate && endDate) {
    nombreArchivo = `orden_${startDate}_a_${endDate}.pdf`;
  } else if (order_id) {
    nombreArchivo = `orden_${order_id}.pdf`;
  }
  try {
    const resultados = await ReportModel.getReportData({
      order_id,
      startDate,
      endDate,
    });

    const ordenes = resultados.ecvnty || [];
    
    // Verificar si hay datos ANTES de crear el PDF
    if (!ordenes || ordenes.length === 0) {
      return res.status(404).json({
        result: false,
        message: 'No hay datos para mostrar.'
      });
    }

    // Solo crear el PDF si hay datos válidos
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${nombreArchivo}`);
    doc.pipe(res);
    ordenes.forEach((orden, idx) => {
      if (idx > 0) doc.addPage();
      
      // Definir margin al inicio
      const margin = 40;
      
      // Calcular totalProductos al inicio antes de usarlo
      const totalProductos = orden.productos.reduce((acc, p) => acc + Number(p.quantity), 0);
      
      // Calcular totales al inicio
      const subTotalObj = orden.order_total.find(ot => ot.code === 'sub_total');
      const shippingObj = orden.order_total.find(ot => ot.code === 'shipping');
      const totalObj = orden.order_total.find(ot => ot.code === 'total');
      const subTotalVal = subTotalObj && subTotalObj.value ? Number(subTotalObj.value).toFixed(2) : '0.00';
      const shippingVal = shippingObj && shippingObj.value ? Number(shippingObj.value).toFixed(2) : '0.00';
      const totalVal = totalObj && totalObj.value ? Number(totalObj.value).toFixed(2) : '0.00';
      
      // Definir variables para cajas de facturación y envío
      const boxWidth = 240;
      const boxWidthShipping = 260;
      const boxHeight = 120;
      const boxLeftX = margin;
      const boxRightX = doc.page.width / 2 + margin - 30;
      
      // Definir variables para caja de totales
      const totalBoxWidth = 300;
      const totalBoxHeight = 50;
      const totalBoxX = doc.page.width - margin - totalBoxWidth;
      
      // Definir variables para layout del encabezado
      const leftX = margin;
      const rightX = doc.page.width / 2 + margin;
      const topY = margin;
      const leftBoxWidth = doc.page.width / 2 - margin;
      const infoWidth = 240;
      const rightXAdjusted = rightX - 30;
      
      // Encabezado personalizado
    doc.fontSize(16).font("Helvetica-Bold").text("ORDEN DE SURTIDO", leftX, topY, { width: leftBoxWidth, align: "center" });
    doc.fontSize(16).font("Helvetica-Bold").text("VANITY", leftX, topY + 25, { width: leftBoxWidth, align: "center" });
    doc.fontSize(16).font("Helvetica-Bold").text("2025 FOR MARY KAY", leftX, topY + 50, { width: leftBoxWidth, align: "center" });
    // Lado derecho: datos de la orden (desplazados 20px a la izquierda)
      let infoY = topY;
      doc.fontSize(10).font("Helvetica-Bold").text(`ID Pedido #`, rightXAdjusted, infoY, { continued: true, width: infoWidth });
      doc.font("Helvetica").text(`${orden.order_id}`, { width: infoWidth }); infoY += 18;
      doc.fontSize(10).font("Helvetica-Bold").text(`No Orden #`, rightXAdjusted, infoY, { continued: true, width: infoWidth });
      doc.font("Helvetica").text(`${orden.invoice_no}`, { width: infoWidth }); infoY += 18;
      doc.fontSize(10).font("Helvetica-Bold").text(`Fecha: `, rightXAdjusted, infoY, { continued: true, width: infoWidth });
      doc.font("Helvetica").text(`${orden.date_added}`, { width: infoWidth }); infoY += 18;
      doc.fontSize(10).font("Helvetica-Bold").text(`Email: `, rightXAdjusted, infoY, { continued: true, width: infoWidth });
      doc.font("Helvetica").text(`${orden.email}`, { width: infoWidth }); infoY += 18;
      doc.fontSize(10).font("Helvetica-Bold").text(``, rightXAdjusted, infoY, { continued: true, width: infoWidth });
      doc.font("Helvetica").text(`${orden.payment_method}`, { width: infoWidth }); infoY += 18;
      
      if (orden.clicod && orden.clicod.trim() !== '') {
        doc.fontSize(10).font("Helvetica-Bold").text(`No. Cliente Proscai: `, rightXAdjusted, infoY, { continued: true, width: infoWidth });
        doc.font("Helvetica").text(`${orden.clicod}`, { width: infoWidth }); infoY += 18;
      } else {
        doc.fontSize(10).font("Helvetica-Bold").text(`No solicita factura`, rightXAdjusted, infoY, { width: infoWidth }); infoY += 18;
      }
      doc.y = Math.max(topY + 80, infoY) + 10;
    // Determinar la altura Y para ambos elementos (al mismo nivel)
    doc.moveDown(1);
    // Variables de redimension
    const alignedY = doc.y;
    const boxTopY = alignedY + 30;
    const totalBoxY = alignedY;
    
    // Contenedor de facturación y envío
      // Caja de facturación
      doc.font("Helvetica-Bold").text("Datos de Facturación", boxLeftX + 5, boxTopY + 5);
      // Caja de facturación
      let factY = boxTopY + 25;
      const factStartY = factY;
      orden.payment.forEach((p) => {
        doc.font("Helvetica").text(`${p.payment_company && p.payment_company.trim() !== '' ? p.payment_company : 'N/A'}`, boxLeftX + 10, factY, { width: boxWidth - 20, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("RFC: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_rfc && p.payment_rfc.trim() !== '' ? p.payment_rfc : 'N/A', { width: boxWidth - 50, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("Calle: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_address_1 && p.payment_address_1.trim() !== '' ? p.payment_address_1 : 'N/A', { width: boxWidth - 60, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("No. Ext.: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_address_no_ext && p.payment_address_no_ext.trim() !== '' ? p.payment_address_no_ext : 'N/A', { continued: true, width: 50, lineBreak: false });
        doc.font("Helvetica-Bold").text(" No. Int.: ", { continued: true });
        doc.font("Helvetica").text(p.payment_address_no_int && p.payment_address_no_int.trim() !== '' ? p.payment_address_no_int : 'N/A', { width: 50, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("Colonia: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_address_2 && p.payment_address_2.trim() !== '' ? p.payment_address_2 : 'N/A', { width: boxWidth - 70, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("Ciudad: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_city && p.payment_city.trim() !== '' ? p.payment_city : 'N/A', { width: boxWidth - 60, lineBreak: false }); factY += 15;
        doc.font("Helvetica-Bold").text("EDO: ", boxLeftX + 10, factY, { continued: true });
        doc.font("Helvetica").text(p.payment_zone && p.payment_zone.trim() !== '' ? p.payment_zone : 'N/A', { continued: true, width: 80, lineBreak: false });
        doc.font("Helvetica-Bold").text(" Código Postal: ", { continued: true });
        doc.font("Helvetica").text(p.payment_postcode && p.payment_postcode.trim() !== '' ? p.payment_postcode : 'N/A', { width: 80, lineBreak: false }); factY += 15;
      });
      
      // Calcular altura dinámica de la caja de facturación
      const factHeight = Math.max(factY - boxTopY + 15, 80);
      doc.rect(boxLeftX, boxTopY, boxWidth, factHeight).stroke();

      // Caja de envío
      doc.font("Helvetica-Bold").text("Datos de Envío", boxRightX + 5, boxTopY + 5);
      let envY = boxTopY + 25;
      const envStartY = envY;
      orden.shipping.forEach((s) => {
        doc.font("Helvetica").text(`${s.shipping_firstname}`, boxRightX + 10, envY, { width: boxWidthShipping - 20, lineBreak: false }); envY += 15;
        doc.font("Helvetica-Bold").text("Calle: ", boxRightX + 10, envY, { continued: true });
        doc.font("Helvetica").text(s.shipping_address_1, { width: boxWidthShipping - 60, lineBreak: false }); envY += 15;
        doc.font("Helvetica-Bold").text("No. Ext.: ", boxRightX + 10, envY, { continued: true });
        doc.font("Helvetica").text(s.shipping_address_no_ext && s.shipping_address_no_ext.trim() !== '' ? s.shipping_address_no_ext : 'N/A', { continued: true, width: 50, lineBreak: false });
        doc.font("Helvetica-Bold").text(" No. Int.: ", { continued: true });
        doc.font("Helvetica").text(s.shipping_address_no_int && s.shipping_address_no_int.trim() !== '' ? s.shipping_address_no_int : 'N/A', { width: 50, lineBreak: false }); envY += 15;
        doc.font("Helvetica-Bold").text("Colonia: ", boxRightX + 10, envY, { continued: true });
        doc.font("Helvetica").text(s.shipping_address_2, { width: boxWidthShipping - 70, lineBreak: false }); envY += 15;
        doc.font("Helvetica-Bold").text("Ciudad: ", boxRightX + 10, envY, { continued: true });
        doc.font("Helvetica").text(s.shipping_city, { width: boxWidthShipping - 60, lineBreak: false }); envY += 15;
        doc.font("Helvetica-Bold").text("EDO: ", boxRightX + 10, envY, { continued: true });
        doc.font("Helvetica").text(s.shipping_zone && s.shipping_zone.trim() !== '' ? s.shipping_zone : 'N/A', { continued: true, width: 80, lineBreak: false });
        doc.font("Helvetica-Bold").text(" Código Postal: ", { continued: true });
        doc.font("Helvetica").text(s.shipping_postcode && s.shipping_postcode.trim() !== '' ? s.shipping_postcode : 'N/A', { width: 80, lineBreak: false }); envY += 15;
      });

      // Calcular altura dinámica de la caja de envío
      const envHeight = Math.max(envY - boxTopY + 15, 80);
      doc.rect(boxRightX, boxTopY, boxWidthShipping, envHeight).stroke();
      
      // Usar la altura máxima de ambas cajas para continuar
      const maxBoxHeight = Math.max(factHeight, envHeight);

      // Mover el cursor debajo de los cuadros usando la altura máxima
      doc.y = boxTopY + maxBoxHeight + 20;
      // Productos
      const startX = margin;
      let startY = doc.y + 10;

      // Encabezados
      const headers = [
        { label: "Modelo", width: 80 },
        { label: "Nombre", width: 180 },
        { label: "Talla", width: 35 },
        { label: "Cantidad", width: 70 },
        { label: "Precio", width: 90 },
        { label: "Total", width: 80 },
      ];

      headers.forEach((h, idx) => {
        doc
          .font("Helvetica-Bold")
          .text(
            h.label,
            startX + headers.slice(0, idx).reduce((a, b) => a + b.width, 0),
            startY,
            { width: h.width, align: "left" }
          );
      });
      doc.moveDown(0.5);

      // Línea debajo de encabezados
      doc
        .moveTo(startX, startY + 15)
        .lineTo(startX + headers.reduce((a, b) => a + b.width, 0), startY + 15)
        .stroke();

      orden.productos.forEach((p, i) => {
        const totalProducto = (
          parseFloat(p.price) * parseFloat(p.quantity)
        ).toFixed(2);
        const rowY = startY + 20 + i * 20;
        const row = [
          { value: p.model, width: 80 },
          { value: p.name, width: 180 },
          { value: p.value, width: 35 },
          { value: p.quantity, width: 70 },
          { value: `$${formatCurrency(p.price)}`, width: 90 },
          { value: `$${formatCurrency(totalProducto)}`, width: 80 },
        ];
        row.forEach((cell, idx) => {
          doc
            .font("Helvetica")
            .text(
              cell.value,
              startX + row.slice(0, idx).reduce((a, b) => a + b.width, 0),
              rowY,
              { width: cell.width, align: "left" }
            );
        });
        doc
          .moveTo(startX, rowY + 15)
          .lineTo(startX + headers.reduce((a, b) => a + b.width, 0), rowY + 15)
          .stroke();
      });

    doc.moveDown(2);
    
    // Total de prendas
    const finalY = doc.y;
    doc.fontSize(12).font('Helvetica-Bold').text(`Total de prendas: ${totalProductos}`, margin, finalY, { align: 'left' });
    
    // Totales monetarios
    const finalTotalBoxY = finalY;
    let finalTotalY = finalTotalBoxY + 10;
    doc.fontSize(10).font('Helvetica').text(`Sub-Total (Con IVA): $${formatCurrency(subTotalVal)}`, totalBoxX + 10, finalTotalY, { width: totalBoxWidth - 20, align: 'right' });
    finalTotalY += 15;
    doc.fontSize(10).font('Helvetica').text(`Costo de Envio (Con IVA): $${formatCurrency(shippingVal)}`, totalBoxX + 10, finalTotalY, { width: totalBoxWidth - 20, align: 'right' });
    finalTotalY += 15;
    doc.fontSize(10).font('Helvetica').text(`Total (Con IVA): $${formatCurrency(totalVal)}`, totalBoxX + 10, finalTotalY, { width: totalBoxWidth - 20, align: 'right' });
    });
    doc.end();
  } catch (error) {
    console.error('Error al generar el reporte:', error);
    if (!res.headersSent) {
      if (error.message && error.message.includes('Debes enviar ambos parámetros de fecha')) {
        res.status(400).json({
          result: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          result: false,
          message: "Error al generar el PDF"
        });
      }
    }
  }
};

exports.getReportByOrder = async (req, res) => {
  const fechaOrdeninicio = req.query.fechaInicio;
  const fechaOrdenfinal = req.query.fechaFinal;
  try {
    const resultados = await ReportModel.getReportData({
      fechaOrdeninicio,
      fechaOrdenfinal,
    });
    res.json({
      result: true,
      resultados,
    });
  } catch (error) {
    console.error("Error en consulta:", error);
    res.status(500).json({
      error: error.message,
      message: "Error al consultar los reportes",
    });
  }
};

exports.getReportByDateRange = (req, res) => {
  res.send("Reporte por rango de fechas");
};

exports.getClientsWithInvoiceByDateRange = (req, res) => {
  res.send("Clientes que requieren factura por rango de fechas");
};
