// https://docs.ethers.org/v6/getting-started/
let provider = null;
let signer = null;
let wallet = null;
let contract = null;
let raw_chain_id = null;

// main
let tweet_modal = new bootstrap.Modal($('.modal')[0]);
$('.btn-tweet').attr('href', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(TWEET_TEXT));

// enable tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// connect button
$('#connect').click(async _ => {
  if (window.ethereum === undefined) {
    alert('Please open by MetaMask browser');
    return;
  }

  // press button effect
  $('#connect').addClass('disabled');

  // connect metamask
  provider = new ethers.BrowserProvider(window.ethereum)
  signer = await provider.getSigner();

  // switch chain
  let changed = await switch_chain();
  if (changed) return;

  console.log('💬', 'connecting wallet..');
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);

  // get claimable token
  let raw_qty = await contract.getFunction('claimableTokens').staticCall(signer.address);
  let qty = raw2float(raw_qty);

  // update connect/disconnect buttons
  hide_connect();
  show_disconnect();

  // update claim button
  $('#claim')
    .text(`Claim ${qty} ${TOKEN_NAME}`)
    .removeClass('d-none');
});
$('#disconnect').click(_ => {
  $('#connect')
    .removeClass('disabled')
    .removeClass('d-none');
  $('#claim')
    .removeClass('disabled')
    .addClass('d-none');
  $('#claiming').addClass('d-none');
  $('#msg').addClass('d-none');
  $('#disconnect').addClass('d-none');
  tweet_modal.hide();
});

// claim button
$('#claim').click(async _ => {
  // recheck chain before claim
  let [ok, msg] = await validate_chain();
  if (!ok) {
    alert(msg);
    return;
  }
  $('#claim').addClass('d-none');
  $('#claiming').removeClass('d-none');
  // claim
  claim_by_gas_rate(contract, MINT_GAS_RATE)
    .then(tx => {
      console.log(tx);
      return tx.wait();
    })
    .then(receipt => { // https://docs.ethers.org/v6/api/providers/#TransactionReceipt
      console.log(receipt);
      $('#claiming').addClass('d-none');
      if (receipt.status != 1) { // 1 success, 0 revert
        alert(JSON.stringify(receipt.toJSON()));
        $('#claim').removeClass('d-none');
        return;
      }
      tweet_modal.show();
      play_party_effect();
      show_claimed();
    })
    .catch(e => {
      alert(e);
      $('#claim').removeClass('d-none');
      $('#claiming').addClass('d-none');
    });
});

// reconnect when switch account
window.ethereum.on('accountsChanged', function (accounts) {
  console.log('💬', 'changed account');
  $('#disconnect').click();
  is_chain_ready(_ => $('#connect').click());
});

// disconnect when switch chain
window.ethereum.on('chainChanged', function (networkId) {
  raw_chain_id = networkId;
  console.log('💬', 'changed chain');
  $('#disconnect').click();
  is_chain_ready(_ => $('#connect').click());
});

// web3 functions
function is_chain_ready(callback) {
  let ready = parseInt(raw_chain_id) == CHAIN_ID;
  if (ready && callback) callback();
  return ready;
}
function handle_chain_exception(err) {
  let msg = `Please change network to [${CHAIN_NAME}] before claim.`;
  alert(`${msg}\n\n----- Error Info -----\n[${err.code}] ${err.message}`);
  $('#connect').removeClass('disabled');
}
async function validate_chain() {
  // https://ethereum.stackexchange.com/questions/134610/metamask-detectethereumprovider-check-is-connected-to-specific-chain
  let { chainId } = await provider.getNetwork();
  raw_chain_id = chainId;
  let ok = is_chain_ready();
  let msg = ok ? null : `Please change network to [${CHAIN_NAME}] before claim.`;
  return [ ok, msg ];
}
async function switch_chain() {
  // https://docs.metamask.io/wallet/reference/wallet_addethereumchain/
  let [ok, _] = await validate_chain();
  if (ok) return false;
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
    return true;
  }
  // if chain not found, add chain
  catch(error) {
    if ([-32603, 4902].includes(error.code)) { // chain not added
      try {
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
      catch(error) {
        handle_chain_exception(error);
      }
    }
    else {
      handle_chain_exception(error);
    }
    return true;
  }
}
async function claim_by_gas_rate(contract, gas_rate=1) {
  if (gas_rate == 1) {
    return contract.getFunction('claim').send();
  }
  else {
    let fn = contract.getFunction('claim');
    let params = [];
    let gas_limit = await fn.estimateGas(...params);
    gas_limit = Math.ceil(Number(gas_limit) * gas_rate);
    return fn.send(...params, { gasLimit: gas_limit });
  }
}
async function load_contract_obj() { // for console use
  provider = new ethers.BrowserProvider(window.ethereum)
  signer = await provider.getSigner();
  let [ok, msg] = await validate_chain();
  if (!ok) { console.warn(msg); return; }
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
  console.log('done');
}

// number
// raw 18 decimals over Number.MAX_SAFE_INTEGER (9_007_199_254_740_991)
function raw2float(raw) {
  let num = Number(raw.toString().slice(0, -9)); // remove last 9 zeros
  return num / 1_000_000_000//_000_000_000;
}
function float2raw(f) { // 18 decimals from * 10^9 * 10^9
  return BigInt(f * 1_000_000_000) * 1_000_000_000n;
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
function show_msg(msg, auto=false) {
  hide_connect();
  $('#msg').text(msg).removeClass('d-none');
  if (auto) show_disconnect();
}
function hide_connect() {
  return $('#connect').addClass('d-none');
}
function show_disconnect() {
  let btn = $('#disconnect').removeClass('d-none');
  if (signer != null) btn.text(`Disconnect ${short_addr(signer.address)}`);
  return btn;
}
let show_claimed = _ => show_msg('Claimed');
