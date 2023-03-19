const EthDater = require('ethereum-block-by-date');
const { ethers } = require('ethers');
const rpcURL = 'https://cloudflare-eth.com/'
const provider = new ethers.providers.JsonRpcProvider(rpcURL)

const dater = new EthDater(provider)

const main = async () => {
  let block = await dater.getDate('2022-12-31T16:59:59Z');
  console.log(block)
}

main()

