'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Products: add cloudinaryId, thumbnailUrl, mediumUrl, placeholderUrl
    await queryInterface.addColumn('products', 'cloudinaryId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'thumbnailUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'mediumUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('products', 'placeholderUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Users: add avatarUrl, avatarCloudinaryId
    await queryInterface.addColumn('users', 'avatarUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'avatarCloudinaryId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('products', 'cloudinaryId');
    await queryInterface.removeColumn('products', 'thumbnailUrl');
    await queryInterface.removeColumn('products', 'mediumUrl');
    await queryInterface.removeColumn('products', 'placeholderUrl');
    await queryInterface.removeColumn('users', 'avatarUrl');
    await queryInterface.removeColumn('users', 'avatarCloudinaryId');
  }
};
