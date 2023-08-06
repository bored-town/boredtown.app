// https://docs.ethers.org/v6/getting-started/
let provider = null;
let signer = null;
let wallet = null;
let contract = null;
let reader = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, new ethers.JsonRpcProvider(CHAIN_RPC));

// main
update_supply();

// connect/disconnect buttons
$('#connect').click(async _ => {
  $('#connect').addClass('disabled');

  // connect metamask
  provider = new ethers.BrowserProvider(window.ethereum)
  signer = await provider.getSigner();

  // switch chain
  await switch_opbnb_chain();

  // get remaining qty
  let minted_qty = await reader.getFunction('numberMinted').staticCall(signer.address)
  let remaining_qty = MINT_PER_WALLET - parseInt(minted_qty);

  // update connect/disconnect buttons
  $('#connect')
    .addClass('d-none')
    .removeClass('disabled');
  $('#disconnect')
    .text(`Disconnect ${short_addr(signer.address)}`)
    .removeClass('d-none');

  // 1) mintable
  if (remaining_qty > 0) {
    $('#mint')
      .text(`MINT x${remaining_qty} (FREE)`)
      .attr('qty', remaining_qty)
      .removeClass('d-none');
  }
  // 2) minted
  else {
    $('#minted').removeClass('d-none');
  }
});
$('#disconnect').click(_ => {
  $('#connect').removeClass('d-none');
  $('#mint').addClass('d-none');
  $('#minted').addClass('d-none');
  $('#disconnect').addClass('d-none');
});

// mint button
$('#mint').click(_ => {
  $('#mint').addClass('disabled');
  // mint
  let qty = +$('#mint').attr('qty');
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
  contract.getFunction('mint').send(qty)
    .then(_ => {
      play_party_effect();
      update_supply();
      $('#mint').addClass('d-none');
      $('#minted').removeClass('d-none');
    })
    .catch(e => {
      alert(e);
      $('#mint').removeClass('disabled');
    });
});

// reconnect when switch account
window.ethereum.on('accountsChanged', function (accounts) {
  $('#disconnect').click();
  $('#connect').click();
});

// disconnect when switch chain
window.ethereum.on('chainChanged', function (networkId) {
  if (parseInt(networkId) == CHAIN_ID) return;
  $('#disconnect').click();
});

// web3 functions
function update_supply() {
  $('#supply').html('Minted: ...');
  reader.getFunction('remainingSupply').staticCall().then(remain => {
    let minted = MAX_SUPPLY - parseInt(remain);
    $('#supply').html(`Minted: ${minted}/${MAX_SUPPLY}`);
  });
}
async function switch_opbnb_chain() {
  // https://docs.metamask.io/wallet/reference/wallet_addethereumchain/
  // https://ethereum.stackexchange.com/questions/134610/metamask-detectethereumprovider-check-is-connected-to-specific-chain
  let { chainId } = await provider.getNetwork();
  chainId = parseInt(chainId);
  if (chainId == CHAIN_ID) return;
  // switch chain
  try {
    await window.ethereum.request({
      "method": "wallet_switchEthereumChain",
      "params": [
        {
          "chainId": "0x" + CHAIN_ID.toString(16),
        }
      ]
    });
  }
  // if chain not found, add chain
  catch(error) {
    await window.ethereum.request({
      "method": "wallet_addEthereumChain",
      "params": [
        {
          "chainId": "0x" + CHAIN_ID.toString(16),
          "chainName": CHAIN_NAME,
          "rpcUrls": [
            CHAIN_RPC,
          ],
          //"iconUrls": [
          //  "https://xdaichain.com/fake/example/url/xdai.svg",
          //  "https://xdaichain.com/fake/example/url/xdai.png"
          //],
          "nativeCurrency": {
            "name": CHAIN_SYMBOL,
            "symbol": CHAIN_SYMBOL,
            "decimals": 18
          },
          "blockExplorerUrls": [
            CHAIN_EXPLORER,
          ]
        }
      ]
    });
  }
}

// common
function short_addr(addr) {
  return addr.substr(0, 5) + '...' + addr.slice(-4);
}
function play_party_effect() {
  party.confetti(document.body, {
      count: 120,
      size: 2,
  });
}
