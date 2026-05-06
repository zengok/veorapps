const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Veor Collection API',
      version: '2.0.0',
      description: `
## Veor Collection – Parfüm Envanter ve Satış Yönetim API'si

Bu API, Veor Collection uygulamasının tüm backend operasyonlarını yönetir.

### Kimlik Doğrulama
Tüm korumalı endpoint'ler **Bearer Token** (JWT) gerektirir.

\`\`\`
Authorization: Bearer <token>
\`\`\`

### Rate Limiting
- **Login:** 5 istek / 15 dakika (IP başına)
- **Diğer API'ler:** 100 istek / 15 dakika (IP başına)

### Hata Formatı
Tüm hata yanıtları standart formatta döner:
\`\`\`json
{ "status": "fail", "message": "Hata mesajı" }
\`\`\`
      `,
      contact: {
        name: 'Veor Collection',
        email: 'admin@veorcollection.com',
      },
      license: {
        name: 'Private',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development',
      },
      {
        url: 'https://api.veorcollection.com',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: '`/api/auth/login` endpoint\'inden alınan token\'ı buraya girin.',
        },
      },
      schemas: {
        // ── User ─────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'batuhan' },
            email: { type: 'string', format: 'email', example: 'batuhan@veorcollection.com' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
            avatarUrl: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/...' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Category ─────────────────────────────────────────────────────
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Classic' },
            description: { type: 'string', nullable: true, example: 'Klasik parfüm koleksiyonu' },
            parentId: { type: 'integer', nullable: true, example: null },
          },
        },
        // ── Product ──────────────────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Veor Classic 50ml' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float', example: 450.00 },
            stock: { type: 'integer', example: 100 },
            categoryId: { type: 'integer', nullable: true, example: 1 },
            imageUrl: { type: 'string', nullable: true, example: 'https://res.cloudinary.com/...' },
            thumbnailUrl: { type: 'string', nullable: true },
            mediumUrl: { type: 'string', nullable: true },
            placeholderUrl: { type: 'string', nullable: true },
            cloudinaryId: { type: 'string', nullable: true },
            sku: { type: 'string', nullable: true, example: 'VEO-CL-001' },
            createdAt: { type: 'string', format: 'date-time' },
            category: { $ref: '#/components/schemas/Category', nullable: true },
          },
        },
        // ── Sale ─────────────────────────────────────────────────────────
        Sale: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            productId: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            quantity: { type: 'integer', example: 2 },
            totalPrice: { type: 'number', format: 'float', example: 900.00 },
            date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['completed', 'cancelled'], example: 'completed' },
            product: { $ref: '#/components/schemas/Product', nullable: true },
            user: { $ref: '#/components/schemas/User', nullable: true },
          },
        },
        // ── Analytics Dashboard ───────────────────────────────────────────
        AnalyticsDashboard: {
          type: 'object',
          properties: {
            totalSales: { type: 'integer', example: 152 },
            totalRevenue: { type: 'number', example: 68400.50 },
            totalProducts: { type: 'integer', example: 24 },
            lowStockCount: { type: 'integer', example: 3 },
          },
        },
        // ── Media Upload Result ───────────────────────────────────────────
        MediaUploadResult: {
          type: 'object',
          properties: {
            publicId: { type: 'string', example: 'veor/products/1234567890-abc123' },
            urls: {
              type: 'object',
              properties: {
                original: { type: 'string' },
                thumbnail: { type: 'string' },
                medium: { type: 'string' },
                large: { type: 'string' },
                placeholder: { type: 'string' },
              },
            },
            originalName: { type: 'string', example: 'product.jpg' },
            size: { type: 'integer', example: 204800 },
            mimetype: { type: 'string', example: 'image/jpeg' },
          },
        },
        // ── Pagination Meta ───────────────────────────────────────────────
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 48 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        // ── Error Response ────────────────────────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['fail', 'error'], example: 'fail' },
            message: { type: 'string', example: 'Hata mesajı' },
          },
        },
      },
      // ── Reusable Parameters ──────────────────────────────────────────────
      parameters: {
        IdParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'Kaynak ID\'si',
        },
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Sayfa numarası',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20 },
          description: 'Sayfa başına kayıt sayısı',
        },
      },
      // ── Reusable Responses ────────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Token eksik veya geçersiz',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'fail', message: 'Lütfen giriş yapınız' },
            },
          },
        },
        Forbidden: {
          description: 'Yetki yetersiz',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'fail', message: 'Bu işlemi yapmaya yetkiniz yok' },
            },
          },
        },
        NotFound: {
          description: 'Kaynak bulunamadı',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'fail', message: 'Kaynak bulunamadı' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit aşıldı',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { status: 'error', message: 'Çok fazla istek, lütfen bekleyin.' },
            },
          },
        },
      },
    },
    // Global security applied to all endpoints unless overridden
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
