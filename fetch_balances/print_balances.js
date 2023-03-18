require('dotenv').config();

const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('../config.json');
const { createContractInstance } = require('./contracts');
const { formatTokenBalance, formatEtherBalance } = require('./utils');

async function getTokenBalancesAtBlock(addresses, blockHeight, provider) {
  const contracts = {
    tether: createContractInstance(config.tokens.tether, provider),
    usdc: createContractInstance(config.tokens.usdc, provider),
    ftm: createContractInstance(config.tokens.ftm, provider),
    matic: createContractInstance(config.tokens.matic, provider),
    link: createContractInstance(config.tokens.link, provider),
    sand: createContractInstance(config.tokens.sand, provider),
    mana: createContractInstance(config.tokens.mana, provider),
  };

  const tokenBalances = {};

  for (const address of addresses) {
    const balancePromises = [
      ...Object.entries(contracts).map(async ([token, contract]) => {
        const balance = await contract.balanceOf(address).then((b) => b.toString());
        return { token, balance };
      }),
      provider.getBalance(address, blockHeight).then((b) => b.toString()),
    ];

    const balances = await Promise.all(balancePromises);

    tokenBalances[address] = balances.reduce((acc, curr, index) => {
      if (index < balances.length - 1) {
        const { token, balance } = curr;
        const decimals = token === 'tether' || token === 'usdc' ? 6 : 18;
        acc[token] = formatTokenBalance(balance, decimals);
      } else {
        acc.eth = formatEtherBalance(curr);
      }
      return acc;
    }, {});
  }

  return tokenBalances;
}

async function main() {
  const addresses = [];

  fs.createReadStream('data/addresses.csv')
    .pipe(csv())
    .on('data', (row) => {
      addresses.push(row.address.toLowerCase());
    })
    .on('end', async () => {
      console.log(`Retrieving balances for ${addresses.length} addresses...`);

      const provider = new ethers.providers.StaticJsonRpcProvider(`https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`);
      const tokenBalances = await getTokenBalancesAtBlock(addresses, 13916166, provider);

      const csvData = ['address,tether,usdc,eth,ftm,matic,link,sand,mana'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.tether},${balances.usdc},${balances.eth},${balances.ftm},${balances.matic},${balances.link},${balances.sand},${balances.mana}`)
      );

      fs.writeFileSync('data/ETH_Mainnet_Balances.csv', csvData.join('\n'));
      console.log('The balances have been written to ETH_Mainnet_Balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
