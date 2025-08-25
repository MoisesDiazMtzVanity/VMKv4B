# VMKv4B - Sistema de Reportes PDF para Mary Kay

Sistema de generación automática de reportes PDF para órdenes de surtido de productos Mary Kay, con integración a múltiples bases de datos y manejo de datos de facturación.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Contribución](#contribución)
- [Pruebas](#pruebas)
- [Roadmap](#roadmap)
- [Autores](#autores)
- [Licencia](#licencia)

## Descripción

VMKv4B es una aplicación Node.js que genera reportes PDF detallados de órdenes de surtido para el negocio de Mary Kay. El sistema integra datos de múltiples fuentes:

- **Base de datos ECVNTY**: Información de órdenes, productos y clientes
- **Base de datos PROSCAI**: Datos de facturación y clientes corporativos
- **Base de datos COMPLEMENT**: Datos complementarios (configurado pero no utilizado actualmente)

### Características

- **Integración multi-base de datos** con MySQL
- **Generación automática de PDFs** con diseño profesional
- **Consultas por ID de pedido** o **rango de fechas**
- **Validación de datos de facturación** con base Proscai
- **API RESTful** con soporte CORS
- **Caché de consultas RFC** para optimización de rendimiento
- **Formato de salida estructurado** con datos de:
  - Información del pedido
  - Datos de facturación y envío
  - Detalle de productos
  - Totales monetarios

## Estructura del Proyecto

```
VMKv4B/
├── src/
│   ├── controllers/
│   │   └── reportController.js    # Lógica de controladores para reportes
│   ├── models/
│   │   └── reportModel.js         # Modelos de datos y consultas DB
│   └── routes/
│       └── reportRoutes.js        # Definición de rutas API
├── app.js                         # Archivo principal de la aplicación
├── package.json                   # Dependencias y scripts
├── .env                           # Variables de entorno (no incluido en repo)
├── .gitignore                     # Archivos ignorados por Git
└── README.md                      # Este archivo
```

### Descripción de Directorios

- **`/src/controllers/`**: Contiene la lógica de negocio para manejar requests HTTP
- **`/src/models/`**: Modelos de datos y funciones de acceso a base de datos
- **`/src/routes/`**: Definición de endpoints y routing de la API
- **`app.js`**: Configuración principal del servidor Express

## Requisitos Previos

- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **MySQL** >= 5.7
- Acceso a las bases de datos:
  - ECVNTY (datos de órdenes)
  - PROSCAI (datos de facturación)

## Instalación

1. **Clonar el repositorio**
   ```bash
   git clone git@github.com:MoisesDiazMtzVanity/VMKv4B.git
   cd VMKv4B
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env
   # Editar .env con las credenciales de la base de datos
   ```

4. **Verificar conexiones de base de datos**
   - Asegúrate de que las bases de datos estén accesibles
   - Verifica credenciales y permisos

5. **Iniciar el servidor**
   ```bash
   npm start
   ```

### Configuración CORS

El servidor está configurado para aceptar requests desde:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`

## Uso

### Iniciar el Servidor

```bash
# Modo desarrollo
npm start

# Con nodemon para desarrollo (si está instalado)
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Ejemplos de Uso

#### 1. Generar PDF por ID de Pedido
```bash
# Browser o herramienta como Postman
GET http://localhost:3000/api/reporte/pdf?idPedido=2406032
```

#### 2. Generar PDF por Rango de Fechas
```bash
GET http://localhost:3000/api/reporte/pdf?fechaInicio=2025-01-01&fechaFinal=2025-12-31
```

#### 3. Obtener Datos JSON (sin PDF)
```bash
GET http://localhost:3000/api/reporte?fechaInicio=2025-01-01&fechaFinal=2025-12-31
```

### Desde Frontend (JavaScript)

```javascript
// Opción 1: Descarga directa
const descargarPDF = (idPedido) => {
  const url = `http://localhost:3000/api/reporte/pdf?idPedido=${idPedido}`;
  window.open(url, '_blank');
};

// Opción 2: Con fetch y blob
const descargarPDFBlob = async (idPedido) => {
  try {
    const response = await fetch(`http://localhost:3000/api/reporte/pdf?idPedido=${idPedido}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `orden_${idPedido}.pdf`;
    a.click();
    
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
  }
};
```

## API Endpoints

### Reportes PDF

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|------------|
| `GET` | `/api/reporte/pdf` | Genera y descarga PDF | `idPedido` OR (`fechaInicio` + `fechaFinal`) |
| `GET` | `/api/reporte` | Obtiene datos en JSON | `fechaInicio` + `fechaFinal` |

### Parámetros de Query

- **`idPedido`**: ID específico del pedido (ej: `2406032`)
- **`fechaInicio`**: Fecha inicio en formato `YYYY-MM-DD`
- **`fechaFinal`**: Fecha fin en formato `YYYY-MM-DD`

### Respuestas

#### Éxito (PDF)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=orden_2406032.pdf
```

#### Error
```json
{
  "result": false,
  "message": "No hay datos para mostrar."
}
```

## 🤝 Contribución

### Proceso de Contribución

1. **Fork** el repositorio
2. **Crear rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** tus cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Abrir Pull Request**

### Convenciones de Código

- **Commits**: Usar [Conventional Commits](https://conventionalcommits.org/)
  - `feat:` nuevas características
  - `fix:` corrección de bugs
  - `docs:` documentación
  - `style:` formateo de código
  - `refactor:` refactorización
  - `test:` pruebas

- **Estilo de Código**:
  - Usar JavaScript ES6+
  - Indentación: 2 espacios
  - Punto y coma al final de línea
  - Nombres descriptivos para variables y funciones

### Ramas

- `main`: Rama principal (estable)
- `develop`: Rama de desarrollo
- `feature/*`: Nuevas funcionalidades
- `hotfix/*`: Correcciones urgentes

## Pruebas

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Pruebas con coverage
npm run test:coverage

# Pruebas en modo watch
npm run test:watch
```

### Estructura de Pruebas

```
tests/
├── unit/                   # Pruebas unitarias
│   ├── models/
│   └── controllers/
├── integration/            # Pruebas de integración
└── e2e/                   # Pruebas end-to-end
```

### Tecnologías de Testing

- **Jest**: Framework de testing
- **Supertest**: Testing de APIs HTTP
- **Mock**: Para simular conexiones de BD

## Roadmap

### Versión 1.1.0
- [ ] Sistema de autenticación y autorización
- [ ] Logs estructurados con Winston
- [ ] Rate limiting para la API
- [ ] Validación de entrada con Joi
- [ ] Documentación API con Swagger

### Versión 1.2.0
- [ ] Dashboard web para visualización
- [ ] Notificaciones por email
- [ ] Export a Excel/CSV
- [ ] Filtros avanzados de búsqueda
- [ ] Cache con Redis

### Versión 2.0.0
- [ ] Migración a TypeScript
- [ ] Microservicios con Docker
- [ ] Base de datos NoSQL para logs
- [ ] Sistema de colas para procesamiento
- [ ] API GraphQL

### Feature Requests

- Usar el template de "Feature Request"
- Explicar el caso de uso
- Proponer implementación si es posible

## Estado del Proyecto

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Estado actual**: Desarrollo activo
**Última actualización**: Agosto 2025
**Próxima release**: v1.1.0 (Septiembre 2025)
