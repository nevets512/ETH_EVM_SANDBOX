require('dotenv').config();

const ethers = require('ethers');
const csv = require('csv-parser');
const fs = require('fs');
const config = require('../config.json');
const { createContractInstance } = require('./contracts');
const { formatTokenBalance, formatEtherBalance } = require('./utils');
const getBlockNumber = require('./getBlocknumber');
const ProgressBar = require('progress');

async function getTokenBalancesAtBlock(addresses, blockHeight, provider) {

  const bar = new ProgressBar('Processing [:bar] :percent :etas', {
    total: addresses.length,
    width: 30,
    complete: '=',
    incomplete: ' ',
    renderThrottle: 100,
  });

  const contracts = {
    USDT: createContractInstance(config.tokens.USDT, provider),
    USDC: createContractInstance(config.tokens.USDC, provider),
    FTM: createContractInstance(config.tokens.FTM, provider),
    MATIC: createContractInstance(config.tokens.MATIC, provider),
    LINK: createContractInstance(config.tokens.LINK, provider),
    SAND: createContractInstance(config.tokens.SAND, provider),
    MANA: createContractInstance(config.tokens.MANA, provider),
    AXS: createContractInstance(config.tokens.AXS, provider),
    ONE_INCH: createContractInstance(config.tokens.ONE_INCH, provider),
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
    ABT: createContractInstance(config.tokens.ABT, provider),
    AXL: createContractInstance(config.tokens.AXL, provider),
    BAL: createContractInstance(config.tokens.BAL, provider),
    BOBA: createContractInstance(config.tokens.BOBA, provider),
    CVC: createContractInstance(config.tokens.CVC, provider),
    DOGE: createContractInstance(config.tokens.DOGE, provider),
    EVX: createContractInstance(config.tokens.EVX, provider),
    FTT: createContractInstance(config.tokens.FTT, provider),
    GAL: createContractInstance(config.tokens.GAL, provider),
    GF: createContractInstance(config.tokens.GF, provider),
    GHST: createContractInstance(config.tokens.GHST, provider),
    GODS: createContractInstance(config.tokens.GODS, provider),
    KNC2: createContractInstance(config.tokens.KNC2, provider),
    LYXE: createContractInstance(config.tokens.LYXE, provider),
    POWR: createContractInstance(config.tokens.POWR, provider),
    RDN: createContractInstance(config.tokens.RDN, provider),
    STG: createContractInstance(config.tokens.STG, provider),
    YGG: createContractInstance(config.tokens.YGG, provider),
    ZRX: createContractInstance(config.tokens.ZRX, provider),
    JFIN: createContractInstance(config.tokens.JFIN, provider)
  };

  const tokenBalances = {};

  for (const address of addresses) {
    const balancePromises = [
      ...Object.entries(contracts).map(async ([token, contract]) => {
        const balance = await contract.balanceOf(address, { blockTag: blockHeight }).then((b) => b.toString());
        return { token, balance };
      }),
      provider.getBalance(address, blockHeight).then((b) => b.toString()),
    ];

    const balances = await Promise.all(balancePromises);

    tokenBalances[address] = balances.reduce((acc, curr, index) => {
      if (index < balances.length - 1) {
        const { token, balance } = curr;
        const decimals = token === 'USDT' || token === 'USDC' ? 6 : 18;
        acc[token] = formatTokenBalance(balance, decimals);
      } else {
        acc.ETH = formatEtherBalance(curr);
      }
      return acc;
    }, {});

    // Update the progress bar
    bar.tick();
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

      const csvData = ['address,USDT,USDC,ETH,FTM,MATIC,LINK,SAND,MANA,AXS,ONE_INCH,AAVE,ALPHA,APE,BAT,CHZ,COMP,CRO,CRV,CVX,DAI,DYDX,ENJ,ENS,GALA,GLM,GRT,GT,ILV,IMX,KUB,LDO,LRC,MKR,OCEAN,OMG,SNT,SNX,SUSHI,UNI,YFI,ABT,AXL,BAL,BOBA,CVC,DOGE,EVX,FTT,GAL,GF,GHST,GODS,KNC2,LYXE,POWR,RDN,STG,YGG,ZRX,JFIN'].concat(
        Object.entries(tokenBalances).map(([address, balances]) =>
          `${address},${balances.USDT},${balances.USDC},${balances.ETH},${balances.FTM},${balances.MATIC},${balances.LINK},${balances.SAND},${balances.MANA},${balances.AXS},${balances.ONE_INCH},${balances.AAVE},${balances.ALPHA},${balances.APE},${balances.BAT},${balances.CHZ},${balances.COMP},${balances.CRO},${balances.CRV},${balances.CVX},${balances.DAI},${balances.DYDX},${balances.ENJ},${balances.ENS},${balances.GALA},${balances.GLM},${balances.GRT},${balances.GT},${balances.ILV},${balances.IMX},${balances.KUB},${balances.LDO},${balances.LRC},${balances.MKR},${balances.OCEAN},${balances.OMG},${balances.SNT},${balances.SNX},${balances.SUSHI},${balances.UNI},${balances.YFI},${balances.ABT},${balances.AXL},${balances.BAL},${balances.BOBA},${balances.CVC},${balances.DOGE},${balances.EVX},${balances.FTT},${balances.GAL},${balances.GF},${balances.GHST},${balances.GODS},${balances.KNC2},${balances.LYXE},${balances.POWR},${balances.RDN},${balances.STG},${balances.YGG},${balances.ZRX},${balances.JFIN}`)
      );

      fs.writeFileSync('data/ETH_Mainnet_Balances.csv', csvData.join('\n'));
      console.log('The balances have been written to ETH_Mainnet_Balances.csv');
    });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
