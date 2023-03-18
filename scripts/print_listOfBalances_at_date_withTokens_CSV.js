const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');

// Import the configuration from the config.json file
const config = require('../config.json');

async function getTokenBalancesAtBlock(addresses, blockHeight) {
  // Create a provider with the Infura endpoint for the Ethereum mainnet
  const provider = new ethers.providers.InfuraProvider('mainnet');

  // Load the ERC20 ABI interface to interact with the token contracts
  const abi = [
    'function balanceOf(address owner) view returns (uint256)',
  ];

  // Create instances of the token contracts
  const tetherContract = new ethers.Contract(config.tokens.tether, abi, provider);
  const usdcContract = new ethers.Contract(config.tokens.usdc, abi, provider);
  const ftmContract = new ethers.Contract(config.tokens.ftm, abi, provider);
  const maticContract = new ethers.Contract(config.tokens.matic, abi, provider);
  const linkContract = new ethers.Contract(config.tokens.link, abi, provider);
  const sandContract = new ethers.Contract(config.tokens.sand, abi, provider);
  const manaContract = new ethers.Contract(config.tokens.mana, abi, provider);

  // Create an empty object to store the token balances
  const tokenBalances = {};

  // Loop through the list of addresses
  for (const address of addresses) {
    // Retrieve the balances of the current address for the tokens at the specified block height
    const tetherBalance = await tetherContract.balanceOf(address).then(balance => balance.toString());
    const usdcBalance = await usdcContract.balanceOf(address).then(balance => balance.toString());
    const ftmBalance = await ftmContract.balanceOf(address).then(balance => balance.toString());
    const maticBalance = await maticContract.balanceOf(address).then(balance => balance.toString());
    const linkBalance = await linkContract.balanceOf(address).then(balance => balance.toString());
    const sandBalance = await sandContract.balanceOf(address).then(balance => balance.toString());
    const manaBalance = await manaContract.balanceOf(address).then(balance => balance.toString());

    // Retrieve the ETH balance for the current address at the specified block height
    const ethBalance = await provider.getBalance(address, blockHeight).then(balance => balance.toString());

    // Convert the token balances to human-readable strings and store them in the tokenBalances object
    tokenBalances[address] = {
      ...tokenBalances[address],
      tether: ethers.utils.formatUnits(tetherBalance, 6),
      usdc: ethers.utils.formatUnits(usdcBalance, 6),
      eth: ethers.utils.formatEther(ethBalance),
      ftm: ethers.utils.formatUnits(ftmBalance, 18),
      matic: ethers.utils.formatUnits(maticBalance, 18),
      link: ethers.utils.formatUnits(linkBalance, 18),
      sand: ethers.utils.formatUnits(sandBalance, 18),
      mana: ethers.utils.formatUnits(manaBalance, 18),
    };
  }

  // Return the tokenBalances object
  return tokenBalances;
}

async function main() {
  // Read the addresses from the CSV file
  const addresses = [];
  
  fs.createReadStream('data/addresses.csv')
    .pipe(csv())
    .on('data', (row) => {
      addresses.push(row.address.toLowerCase());
    })
    .on('end', async () => {
      console.log(`Retrieving balances for ${addresses.length} addresses...`);

      // Retrieve the balances of Tether and USDC tokens for each address at block height 13916166
      const tokenBalances = await getTokenBalancesAtBlock(addresses, 13916166);

      // Write the balances to a new CSV file
      const csvData = ['address,tether,usdc,eth,ftm,matic,link,sand,mana'].concat(
        Object.entries(tokenBalances).map(([address, balances]) => `${address},${balances.tether},${balances.usdc},${balances.eth},${balances.ftm},${balances.matic},${balances.link},${balances.sand},${balances.mana}`)
      );
      
      fs.writeFileSync('data/balances.csv', csvData.join('\n'));
      console.log('The balances have been written to balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
