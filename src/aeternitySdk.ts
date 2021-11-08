require('dotenv').config({path:__dirname+'/.env'})
const fs = require('fs')
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk')

const contractInterfaceSource = fs.readFileSync(__dirname + '/TokenMigrationInterface.aes', 'utf-8')
import logger from './logger'

let contract: any = null

const init = async () => {
  logger.info(`BEGIN: Initialization of SDK and contract instance started`)
  const keyPair = {
    "publicKey": process.env.PUBLIC_KEY,
    "secretKey": process.env.PRIVATE_KEY
  }
  const client_node = await Universal({
    nodes: [
      {
        name: 'node',
        instance: await Node({
          url: process.env.NODE_URL,
        }),
      }],
    accounts: [MemoryAccount({ keypair: keyPair })],
    compilerUrl: process.env.COMPILER_URL
  });
  contract = await client_node.getContractInstance(contractInterfaceSource, { contractAddress: process.env.CONTRACT_ADDRESS })
  logger.info(`COMPLETE: Initialization of SDK and contract instance finished`)
}

const checkInizialization = () => {
  if(contract === null) {
    throw new Error(`SDK and contract instance not initialized.`)
  }
}

const checkMigrated = async (ethAddress: string) => {
  checkInizialization()
  var result = await contract.methods.is_migrated.get(ethAddress)
  return result.decodedResult
}


const validateValues = async (ethAddress: string, balance: string, index: number, hashes: Array<string>) => {
  checkInizialization()
  const result = await contract.methods.contained_in_merkle_tree(ethAddress, balance, index, hashes)
  return result.decodedResult
}

const migrate = async (ethAddress: string, amount: string, aeAddress: string, leafIndex: number, siblings: Array<string>, signature: string) => {
  checkInizialization()
  if(signature.startsWith('0x')) {
    signature = signature.substring(2)
  }
  let vValue = signature.substring(signature.length - 2)
  switch(vValue) {
      case '00':
      case '27':
          vValue = '1b'
          break
      case '01':
      case '28':
          vValue = '1c'
          break
      default:
          break
  }
  signature = vValue + signature.substring(0, signature.length - 2)
  const migrated = await contract.methods.is_migrated(ethAddress).decodedResult
  if(!migrated) {
    var result = await contract.methods.migrate(amount, aeAddress, leafIndex, siblings, signature, {gas: 50000})
    return result.hash
  } else {
    const msg = `Already performed the migration for Ethereum address: ${ethAddress}`
    logger.warn(msg)
    throw new Error(msg)
  }
};

init()

export {
  checkMigrated,
  validateValues,
  migrate
}