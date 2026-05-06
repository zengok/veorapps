'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'failedLoginAttempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });
    await queryInterface.addColumn('users', 'lockUntil', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'failedLoginAttempts');
    await queryInterface.removeColumn('users', 'lockUntil');
  }
};
