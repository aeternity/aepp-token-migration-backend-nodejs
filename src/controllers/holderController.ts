import { Request, Response } from 'express';
import Holder from '../holders';

import MerkleTree from '../createMerkleTree';
import * as ae from '../aeternitySdk';
import data from '../data/final-token-holders-sorted.json';

import logger from '../logger';

var data_to_array: string[] = []
data_to_array = Object.entries(data).map((e) => ( JSON.stringify({ [e[0]]: e[1] }).replace(/{|}|"/g, '').toUpperCase()));
var tree = new MerkleTree(data_to_array)

const rootHash = (req: Request, res: Response) => {
  return res.send({'status': true, 'tree': {'root': tree.getRootHash(), 'length': tree.leaves.length}});
}

const getInfoByEthAddress = async (req: Request, res: Response) => {
  const ethAddress = req.params.ethAddress;
  try {
    const holder = await Holder.findOne({where: {eth_address: ethAddress.toUpperCase()}})
    if(!holder) {
      return res.status(404).json({
        'message': `Ethereum address ${ethAddress} not included in migration set.`
      })
    }
    try {
      const is_migrated = await ae.checkMigrated(holder.dataValues.eth_address)
      res.send(
        {
          'index': holder.dataValues.leaf_index,
          'hash': holder.dataValues.hash,
          'tokens': holder.dataValues.balance,
          'migrateTxHash': holder.dataValues.migrateTxHash,
          'migrated': is_migrated
        }
      )
    } catch (e) {
      logger.error('Unexpected error.', e)
      return res.status(500).json({
        'message': 'Unexpected error'
      })
    }
  } catch (e) {
    logger.error('Unexpected error.', e)
    return res.status(500).json({
      'message': 'Unexpected error'
    })
  }
}

const getHashByIndex = async (req: Request, res: Response) => {
  try {
    const holder = await Holder.findOne({where: {leaf_index: req.params.index}})
    logger.info(JSON.stringify(holder))
    res.send({'index': holder.dataValues.leaf_index, 'hash': holder.dataValues.hash})
  } catch(e) {
    logger.error('Unexpected error.', e)
    return res.status(500).json({
      'message': 'Unexpected error'
    })
  }
}

const getSiblingsByIndex = async (req: Request, res: Response) => {
  try {
    const holder = await Holder.findOne({where: {leaf_index: req.params.index}})
    res.send({'status': true, 'hashes': holder.dataValues.siblings})
  } catch(e) {
    logger.error('Unexpected error.', e)
    return res.status(500).json({
      'message': 'Unexpected error'
    })
  }
}

const validateRequest = async (req: Request, res: Response) => {
  logger.debug(`Validate request: ${JSON.stringify(req.body)}`)
  if (!req.body.ethAddress || !(typeof req.body.ethAddress === 'string')) {
    return res.status(400).send({'status': false, 'error': `Missing or invalid 'ethAddress' field`, 'exists': false})
  }
  if (!req.body.balance) {
    return res.status(400).send({'status': false, 'error': `Missing 'balance' field`, 'exists': false})
  }
  if (!req.body.hashes || !(req.body.hashes instanceof Array)) {
    return res.status(400).send({'status': false, 'error': `Missing or invalid 'hashes' field`, 'exists': false})
  }
  const validated = await ae.validateValues(req.body.ethAddress, req.body.balance, req.body.index ? req.body.index : 0, req.body.hashes)
  res.send({'status': true, 'exists': validated});
}

const migrate = async (req: Request, res: Response) => {
  if (!req.body.ethPubKey || !(typeof req.body.ethPubKey === 'string')) {
    return res.status(400).send({'status': 'error', 'message': `Missing or invalid 'ethPubKey' field`})
  }
  if (!req.body.aeAddress || !(typeof req.body.aeAddress === 'string')) {
    return res.status(400).send({'status': 'error', 'message': `Missing or invalid 'aeAddress' field`})
  }
  if (!req.body.signature || !(typeof req.body.signature === 'string')) {
    return res.status(400).send({'status': 'error', 'message': `Missing or invalid 'signature' field`})
  }
  const ethAddress = req.body.ethPubKey.toUpperCase()
  const aeAddress = req.body.aeAddress
  const entry = await getEntryByEthPk(ethAddress)
  try {
    const txHash = await ae.migrate(ethAddress, entry.balance, req.body.aeAddress, entry.leaf_index, entry.siblings, req.body.signature)
    try {
      await Holder.update({
        migrateTxHash: txHash,
        ae_address: req.body.aeAddress
      }, {
        where: {leaf_index: entry.leaf_index}
      })
    } catch(e) {
      logger.error(`Unexpected error updating DB entry for ${ethAddress} after successful migration.`, e)
    }
    res.send({'status': 'ok', txHash});
  } catch(e) {
    logger.error(`Unexpected error during migration from Ethereum address ${ethAddress} to aeternity address ${aeAddress}. Error: `, e)
    return res.status(500).json({
      'message': 'Unexpected error'
    })
  }
}

const getEntryByEthPk = async (ethAddress: String) => {
  const holder = await Holder.findOne({ where: { eth_address: ethAddress  } })
  return holder.dataValues
}

const importHolders = async (index: number = 0) => {
  if(index < data_to_array.length) {
    var body = {
      hash: tree.hashFunction(data_to_array[index]),
      eth_address: data_to_array[index].split(':')[0],
      balance: data_to_array[index].split(':')[1],
      siblings: tree.getProof(data_to_array[index]),
      leaf_index: index,
      migrateTxHash: ''
    }
    let holder = new Holder(body)
    logger.debug(JSON.stringify(await holder.save()))
    await importHolders(index + 1)
  }
}

export {
  rootHash,
  getInfoByEthAddress,
  getHashByIndex,
  getSiblingsByIndex,
  validateRequest,
  migrate,
  importHolders
}