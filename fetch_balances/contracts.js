// contracts.js
const ethers = require('ethers');
const config = require('../config.json');

const abi = [
  'function balanceOf(address owner) view returns (uint256)',
];

function createContractInstance(tokenAddress, provider) {
  return new ethers.Contract(tokenAddress, abi, provider);
}

module.exports = {
  createContractInstance,
};
