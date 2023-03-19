require('dotenv').config();

const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('../config.json');
const { createContractInstance } = require('./contracts');
const { formatTokenBalance, formatEtherBalance } = require('./utils');
const getBlockNumber = require('./getBlocknumber');

async function getTokenBalancesAtBlock(addresses, blockHeight, provider) {
  const contracts = {
    tether: createContractInstance(config.tokens.tether, provider),
    usdc: createContractInstance(config.tokens.usdc, provider),
    ftm: createContractInstance(config.tokens.ftm, provider),
    matic: createContractInstance(config.tokens.matic, provider),
    link: createContractInstance(config.tokens.link, provider),
    sand: createContractInstance(config.tokens.sand, provider),
    mana: createContractInstance(config.tokens.mana, provider),
    axs: createContractInstance(config.tokens.axs, provider),
    oneINCH: createContractInstance(config.tokens.oneINCH, provider),
    AAVE: createContractInstance(config.tokens.AAVE, provider),
    ALPHA: createContractInstance(config.tokens.ALPHA, provider),
    APE: createContractInstance(config.tokens.APE, provider),
    BAT: createContractInstance(config.tokens.BAT, provider),
    CHZ: createContractInstance(config.tokens.CHZ, provider),
    COMP: createContractInstance(config.tokens.COMP, provider),
    CRO: createContractInstance(config.tokens.CRO, provider),
    CRV: createContractInstance(config.tokens.CRV, provider),
    CVX: createContractInstance(config.tokens.CVX, provider),
    DAI: createContractInstance(config.tokens.DAI, provider),
    DYDX: createContractInstance(config.tokens.DYDX, provider),
    ENJ: createContractInstance(config.tokens.ENJ, provider),
    ENS: createContractInstance(config.tokens.ENS, provider),
    GALA: createContractInstance(config.tokens.GALA, provider),
    GLM: createContractInstance(config.tokens.GLM, provider),
    GRT: createContractInstance(config.tokens.GRT, provider),
    GT: createContractInstance(config.tokens.GT, provider),
    ILV: createContractInstance(config.tokens.ILV, provider),
    IMX: createContractInstance(config.tokens.IMX, provider),
    KUB: createContractInstance(config.tokens.KUB, provider),
    LDO: createContractInstance(config.tokens.LDO, provider),
    LRC: createContractInstance(config.tokens.LRC, provider),
    MKR: createContractInstance(config.tokens.MKR, provider),
    OCEAN: createContractInstance(config.tokens.OCEAN, provider),
    OMG: createContractInstance(config.tokens.OMG, provider),
    SNT: createContractInstance(config.tokens.SNT, provider),
    SNX: createContractInstance(config.tokens.SNX, provider),
    SUSHI: createContractInstance(config.tokens.SUSHI, provider),
    UNI: createContractInstance(config.tokens.UNI, provider),
    YFI: createContractInstance(config.tokens.YFI, provider),
    ZRX: createContractInstance(config.tokens.ZRX, provider)
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
      const blockInfo = await getBlockNumber();
      const blockNumber = blockInfo.block;      
            
      const tokenBalances = await getTokenBalancesAtBlock(addresses, blockNumber, provider);

      const csvData = ['address,tether,usdc,eth,ftm,matic,link,sand,mana,axs,oneINCH,AAVE,ALPHA,APE,BAT,CHZ,COMP,CRO,CRV,CVX,DAI,DYDX,ENJ,ENS,GALA,GLM,GRT,GT,ILV,IMX,KUB,LDO,LRC,MKR,OCEAN,OMG,SNT,SNX,SUSHI,UNI,YFI,ZRX'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.tether},${balances.usdc},${balances.eth},${balances.ftm},${balances.matic},${balances.link},${balances.sand},${balances.mana},${balances.axs},${balances.oneINCH},${balances.AAVE},${balances.ALPHA},${balances.APE},${balances.BAT},${balances.CHZ},${balances.COMP},${balances.CRO},${balances.CRV},${balances.CVX},${balances.DAI},${balances.DYDX},${balances.ENJ},${balances.ENS},${balances.GALA},${balances.GLM},${balances.GRT},${balances.GT},${balances.ILV},${balances.IMX},${balances.KUB},${balances.LDO},${balances.LRC},${balances.MKR},${balances.OCEAN},${balances.OMG},${balances.SNT},${balances.SNX},${balances.SUSHI},${balances.UNI},${balances.YFI},${balances.ZRX}`)
      );

      fs.writeFileSync('data/ETH_Mainnet_Balances.csv', csvData.join('\n'));
      console.log('The balances have been written to ETH_Mainnet_Balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
