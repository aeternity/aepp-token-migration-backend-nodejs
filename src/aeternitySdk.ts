require('dotenv').config({path:__dirname+'/.env'})
const fs = require('fs')
const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk')

const contractInterfaceSource = fs.readFileSync(__dirname + '/TokenMigrationInterface.aes', 'utf-8')
import { setRequiredVariable } from './helpers'
import logger from './logger'

const publicKey = setRequiredVariable('PUBLIC_KEY')
const privateKey = setRequiredVariable('PRIVATE_KEY')
let contract: any = null

const init = async () => {
  logger.info(`BEGIN: Initialization of SDK and contract instance`)
  const keyPair = {
    "publicKey": publicKey,
    "secretKey": privateKey
  }
  const client_node = await Universal({
    nodes: [
      {
        name: 'node',
        instance: await Node({
          url: process.env.NODE_URL || 'https://mainnet.aeternity.io',
        }),
      }],
    accounts: [MemoryAccount({ keypair: keyPair })],
    compilerUrl: process.env.COMPILER_URL || 'https://compiler.aepps.com'
  });
  contract = await client_node.getContractInstance(contractInterfaceSource, { contractAddress: process.env.CONTRACT_ADDRESS || 'ct_eJhrbPPS4V97VLKEVbSCJFpdA4uyXiZujQyLqMFoYV88TzDe6' })
  logger.info(`COMPLETE: Initialization of SDK and contract instance`)
}

const checkInizialization = () => {
  if(contract === null) {
    throw new Error(`SDK and contract instance not initialized yet.`)
  }
}

const checkMigrated = async (ethAddress: string) => {
  checkInizialization()
  var result = await contract.methods.is_migrated.get(ethAddress.toUpperCase())
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