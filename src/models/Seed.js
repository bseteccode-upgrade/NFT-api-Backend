'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Seed = sequelize.define('Seed', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  encryptedMnemonic: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    comment: 'Encrypted mnemonic phrase',
  },
  lastIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    comment: 'Last used derivation index (auto-incremented)',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'seeds',
  timestamps: true,
});

module.exports = Seed;

