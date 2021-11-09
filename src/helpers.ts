const fs: any = require('fs')
const path: any = require('path')

const getJson = (relativePath: string) => {
    const data = fs.readFileSync(path.resolve(__dirname, relativePath))
    return JSON.parse(data)
}

const getDataArray = () => {
    const data = getJson(process.env.TOKEN_HOLDERS_FILE || './data/final-token-holders-sorted.json')
    return Object.entries(data).map((e) => ( JSON.stringify({ [e[0]]: e[1] }).replace(/{|}|"/g, '').toUpperCase()))
}

const setRequiredVariable = (variableName: string) => {
    if (process.env[variableName]) {
        return process.env[variableName];
    }
    throw new Error(`ENV-variable missing: ${variableName}`);
}

const dataArray = getDataArray()

export {
    dataArray,
    setRequiredVariable
}