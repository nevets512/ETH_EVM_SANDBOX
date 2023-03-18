// utils.js
const ethers = require('ethers');

function formatTokenBalance(balance, decimals) {
  return ethers.utils.formatUnits(balance, decimals);
}

function formatEtherBalance(balance) {
  return ethers.utils.formatEther(balance);
}

module.exports = {
  formatTokenBalance,
  formatEtherBalance,
};
