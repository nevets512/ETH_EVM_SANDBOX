require('dotenv').config();
const EthDater = require('ethereum-block-by-date');
const { ethers } = require('ethers');

const provider = new ethers.providers.StaticJsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`);

const dater = new EthDater(provider);

const getBlockNumber = async () => {
    let block = await dater.getDate('2022-12-31T17:00:00Z');
    return block;
  };
  
  module.exports = getBlockNumber;

// Uncomment this section if this script will be run as a standalone function  
// const main = async () => {
//   let block = await dater.getDate('2022-12-31T17:00:00Z');
//   console.log(block);
// };

// main();
