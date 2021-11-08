import express from 'express';
import * as holderController from './controllers/holderController';
import logger from './logger';

const app = express();
var port = 3000;

app.use(express.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', holderController.rootHash);
app.get('/info/:ethAddress', holderController.getInfoByEthAddress);
app.get('/hash/:index', holderController.getHashByIndex);
app.get('/siblings/:index', holderController.getSiblingsByIndex);
app.post('/validate', holderController.validateRequest);
app.post('/migrate', holderController.migrate);

app.listen(port, () => logger.info(`Running at ${port}!`))
