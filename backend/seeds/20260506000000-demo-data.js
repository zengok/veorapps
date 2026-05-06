'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@veor.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await queryInterface.bulkInsert('categories', [
      {
        id: 1,
        name: 'Parfümler',
        description: 'Genel Parfüm Kategorisi'
      }
    ]);

    await queryInterface.bulkInsert('products', [
      {
        name: 'Veor Signature',
        description: 'Signature koku',
        price: 1500.00,
        stock: 50,
        categoryId: 1,
        sku: 'VEOR-SIG-001',
        createdAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
