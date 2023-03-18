const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');

// Define the addresses for Tether and USDC tokens
const tetherAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

async function getTokenBalancesAtBlock(addresses, blockHeight) {
  // Create a provider with the Infura endpoint for the Ethereum mainnet
  const provider = new ethers.providers.InfuraProvider('mainnet');

  // Load the ERC20 ABI interface to interact with the token contracts
  const abi = [
    'function balanceOf(address owner) view returns (uint256)',
  ];

  // Create instances of the Tether and USDC token contracts
  const tetherContract = new ethers.Contract(tetherAddress, abi, provider);
  const usdcContract = new ethers.Contract(usdcAddress, abi, provider);

  // Create an empty object to store the token balances
  const tokenBalances = {};

  // Loop through the list of addresses
  for (const address of addresses) {
    // Retrieve the balances of the current address for Tether and USDC tokens at the specified block height
    const tetherBalance = await tetherContract.balanceOf(address).then(balance => balance.toString());
    const usdcBalance = await usdcContract.balanceOf(address).then(balance => balance.toString());

    // Convert the token balances to human-readable strings and store them in the tokenBalances object
    tokenBalances[address] = {
      tether: ethers.utils.formatUnits(tetherBalance, 6),
      usdc: ethers.utils.formatUnits(usdcBalance, 6),
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
      const csvData = ['address,balance_tether,balance_usdc'].concat(
        Object.entries(tokenBalances).map(([address, balances]) => `${address},${balances.tether},${balances.usdc}`)
      );
      
      fs.writeFileSync('data/balances.csv', csvData.join('\n'));
      console.log('The balances have been written to balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
