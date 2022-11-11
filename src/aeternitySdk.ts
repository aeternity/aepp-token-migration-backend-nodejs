require('dotenv').config({path:__dirname+'/.env'})
import { AeSdk, Node, MemoryAccount, getAddressFromPriv } from '@aeternity/aepp-sdk'
const contractAci = require('./aci/TokenMigrationACI.json')
import { setRequiredVariable } from './helpers'
import logger from './logger'

const privateKey = setRequiredVariable('PRIVATE_KEY') as string
let contract: any = null

const init = async () => {
  logger.info(`BEGIN: Initialization of SDK and contract instance`)
  const keypair = {
    secretKey: privateKey,
    publicKey: getAddressFromPriv(privateKey)
  }
  const client_node = new AeSdk({
    nodes: [
      {
        name: 'node',
        instance: new Node(process.env.NODE_URL || 'https://mainnet.aeternity.io'),
      }],
    accounts: [new MemoryAccount({ keypair })],
  });
  contract = await client_node.getContractInstance({ aci: contractAci, contractAddress: process.env.CONTRACT_ADDRESS || 'ct_eJhrbPPS4V97VLKEVbSCJFpdA4uyXiZujQyLqMFoYV88TzDe6' })
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
  logger.debug(`Performing migration for ${ethAddress} with target ${aeAddress}.`)
  logger.debug(`amount: ${amount}`)
  logger.debug(`leafIndex: ${leafIndex}`)
  logger.debug(`siblings: ${siblings}`)
  logger.debug(`signature: ${signature}`)
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
  logger.debug(`Check migration.`)
  const migrated = (await contract.methods.is_migrated(ethAddress)).decodedResult
  logger.debug(`Is migrated: ${migrated}`)
  if(!migrated) {
    logger.debug(`Calling migrate function of smart contract.`)
    var result = await contract.methods.migrate(amount, aeAddress, leafIndex, siblings, signature, {gas: 50000})
    logger.debug(`Migration successful: ${result.hash}`)
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