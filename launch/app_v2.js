// https://docs.ethers.org/v6/getting-started/
let provider = null;
let signer = null;
let wallet = null;
let contract = null;
let reader = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, new ethers.JsonRpcProvider(CHAIN_RPC));
let rsupply = MAX_SUPPLY;
let minted_out = false;

// main
update_supply();

// enable tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// connect button
$('#connect').click(async _ => {
  $('#connect').addClass('disabled');

  // connect metamask
  provider = new ethers.BrowserProvider(window.ethereum)
  signer = await provider.getSigner();

  // switch chain
  await switch_chain();

  // 1) check mint enabled
  /* reduce page load
  let mint_enabled = await reader.getFunction('mintEnabled').staticCall();
  if (!mint_enabled) {
    show_mint_disabled();
    return;
  }
  */

  // 2) check whitelist
  if (WHITELIST_SRC != null) {
    let url = WHITELIST_SRC + `?t=${+(new Date())}`;
    let wl_addrs = (await $.get(url)).split('\n').map(l => l.split(',')[0].toLowerCase());
    let mm_addr = signer.address.toLowerCase();
    let pass = wl_addrs.includes(mm_addr);
    // console.log(wl_addrs, mm_addr, pass);
    if (!pass) {
      show_wl_only();
      return;
    }
  }

  // get remaining qty
  let minted_qty = await reader.getFunction('numberMinted').staticCall(signer.address);
  let remaining_qty = Math.min(MINT_PER_WALLET - parseInt(minted_qty), rsupply);

  // update connect/disconnect buttons
  $('#connect')
    .addClass('d-none')
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
    show_minted();
  }
});
$('#disconnect').click(_ => {
  $('#connect')
    .removeClass('disabled')
    .removeClass('d-none');
  $('#mint').addClass('d-none');
  $('#msg').addClass('d-none');
  $('#disconnect').addClass('d-none');
});

// mint button
$('#mint').click(_ => {
  $('#mint').addClass('disabled');
  // mint
  let qty = +$('#mint').attr('qty');
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
  contract.getFunction('mint').send(qty, MINT_SECRET)
    .then(_ => {
      play_party_effect();
      $('#mint').addClass('d-none');
      show_minted();
    })
    .catch(e => {
      alert(e);
      $('#mint').removeClass('disabled');
    });
});

// reconnect when switch account
window.ethereum.on('accountsChanged', function (accounts) {
  if (minted_out) return;
  $('#disconnect').click();
  $('#connect').click();
});

// disconnect when switch chain
window.ethereum.on('chainChanged', function (networkId) {
  if (minted_out) return;
  if (parseInt(networkId) == CHAIN_ID) return;
  $('#disconnect').click();
});

// web3 functions
function update_supply() {
  $('#supply').html('Minted: ...');
  reader.getFunction('remainingSupply').staticCall().then(s => {
    rsupply = parseInt(s);
    let minted = MAX_SUPPLY - parseInt(rsupply);
    $('#supply').html(`Minted: ${minted}/${MAX_SUPPLY}`);
    // minted out ?
    minted_out = minted >= MAX_SUPPLY;
    if (!minted_out)
      $('#connect').removeClass('disabled');
    else
      show_minted_out();
  });
}
async function switch_chain() {
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
    console.log(error);
    if (error.code != 4902) {
      return; // 4902 -- chain not added
    }
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
function show_msg(msg) {
  $('#msg').text(msg).removeClass('d-none');
  $('#connect').addClass('d-none');
}
let show_minted = _ => show_msg('MINTED');
let show_wl_only = _ => show_msg("You're not eligible");
let show_minted_out = _ => show_msg('MINTED OUT');
let show_mint_disabled = _ => show_msg('Mint disabled');
