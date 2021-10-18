const Sequelize = require('sequelize')
import {createAdditions} from './controllers/holderController';

import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });

const sequelize = new Sequelize(<string>process.env.DB_URL)

console.log("going to connect...")


const Holder = sequelize.define(process.env.TABLE_NAME, {
  hash: { type: Sequelize.STRING, allowNull: false },
  eth_address: { type: Sequelize.STRING, allowNull: false},
  balance: { type: Sequelize.STRING, allowNull: true },
  siblings : { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: false},
  leaf_index: { type: Sequelize.INTEGER, allowNull: false },
  ae_address: { type: Sequelize.STRING, allowNull: true},
  migrateTxHash : { type: Sequelize.STRING, allowNull: true}
});

Holder.sync({force: false});
sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
   Holder.count({}).then(async (c:any) => {
     console.log("Current count in DB is: " + c)
    if(c != 21016) {
       console.log("Current count is not correct, Please delete your Table then run this script again.!")
    }
   }).catch((err: any) => {
      console.trace(err)
      console.log("Making database and adding entries...")
      createAdditions()
   })

  }).catch((err: any) => {
    console.trace(err)
    console.error('Unable to connect to the database:', err);
  });



export default Holder;