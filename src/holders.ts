import * as dotenv from 'dotenv'
dotenv.config({ path: __dirname + '/.env' })
const Sequelize = require('sequelize')

import {importHolders} from './controllers/holderController'
import { dataArray, setRequiredVariable } from './helpers'
import logger from './logger'

const dbUrl = setRequiredVariable('DB_URL')
const tableName = setRequiredVariable('TABLE_NAME')

const sequelize = new Sequelize(dbUrl, {
  logging: false
})

const Holder = sequelize.define(tableName,
  {
    hash: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
    eth_address: { type: Sequelize.STRING, allowNull: false},
    balance: { type: Sequelize.STRING, allowNull: true },
    leaf_index: { type: Sequelize.INTEGER, allowNull: false },
    ae_address: { type: Sequelize.STRING, allowNull: true},
    migrateTxHash : { type: Sequelize.STRING, allowNull: true}
  },
  {
    freezeTableName: true,
    tableName: tableName
  }
);

Holder.sync({force: false});
sequelize.authenticate().then(async () => {
  logger.info('Connection has been established successfully.')
  let entryCount;
  try {
    entryCount = await Holder.count({})
    if (entryCount === 0) {
      logger.info('Empty table. Data import required.')
      logger.info('BEGIN: Import data.')
      await importHolders()
      logger.info('COMPLETE: Import data.')
    } else {
      if (entryCount != dataArray.length) {
        throw new Error('Incorrect dataset. Please delete your database table then restart the application.')
      }
    }
  } catch(e) {
    logger.warn('Database does not exist. Creating database.')
    logger.info('BEGIN: Import data.')
    await importHolders()
    logger.info('COMPLETE: Import data.')
  }
})

export default Holder;