// https://docs.ethers.org/v6/getting-started/
let provider = null;
let signer = null;
let wallet = null;
let contract = null;
let token_sell = null;
let reader_sell = new ethers.Contract(SELL_ADDR, ERC20_ABI, new ethers.JsonRpcProvider(CHAIN_RPC));
let reader_buy = new ethers.Contract(BUY_ADDR, ERC20_ABI, new ethers.JsonRpcProvider(CHAIN_RPC));
let raw_chain_id = null;

// main
let tweet_modal = new bootstrap.Modal($('.modal')[0]);
$('.btn-tweet').attr('href', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(TWEET_TEXT));
$('.sell .token').html(SELL_SYMBOL);
$('.buy .token').html(BUY_SYMBOL);

// enable tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// exchange rate
$('.input.sell input').on('input', evt => {
  let sell_amount = +$(evt.target).val();
  let buy_amount = sell_amount * EXCHANGE_RATE;
  $('.input.buy input').val(buy_amount);
}).on('keydown', evt => { // prevent minus (-)
  if (evt.key === '-' || evt.keyCode === 189) evt.preventDefault();
});
$('.input.buy input').on('input', evt => {
  let buy_amount = +$(evt.target).val();
  let sell_amount = buy_amount / EXCHANGE_RATE;
  $('.input.sell input').val(sell_amount);
}).on('keydown', evt => { // prevent minus (-)
  if (evt.key === '-' || evt.keyCode === 189) evt.preventDefault();
});

// auto fill from balance
$('.sell .balance a').on('click', evt => {
  let balance = +$(evt.target).text();
  $('.input.sell input').val(balance).trigger('input');
});
$('.buy .balance a').on('click', evt => {
  let balance = +$(evt.target).text();
  $('.input.buy input').val(balance).trigger('input');
});

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

  // update token balance
  await update_token_balances();

  // update buttons
  hide_connect();
  show_disconnect();
  $('#swap').removeClass('d-none');
});
$('#disconnect').click(_ => {
  $('.input input').val('');
  $('.balance a').text('0');
  //
  $('#connect')
    .removeClass('disabled')
    .removeClass('d-none');
  $('#swap')
    .removeClass('disabled')
    .addClass('d-none');
  $('#busy').addClass('d-none');
  $('#msg').addClass('d-none');
  $('#disconnect').addClass('d-none');
  tweet_modal.hide();
});

// swap button
$('#swap').click(async _ => {
  // recheck input
  let balance_text = $('.sell a').text();
  let sell_text = $('.sell input').val();
  if (balance_text === '...') return;
  if (sell_text === '') return;

  $('#swap').addClass('d-none');
  $('#busy').removeClass('d-none');
  // recheck chain before swap
  let [ok, msg] = await validate_chain();
  if (!ok) {
    reset_swap_button();
    alert(msg);
    return;
  }

  // prepare swap with ERC20
  token_sell = new ethers.Contract(SELL_ADDR, ERC20_ABI, signer);
  let balance = ethers.parseUnits(balance_text, SELL_DECIMALS);
  let allowance = await token_sell.getFunction('allowance').staticCall(signer.address, CONTRACT_ADDR);
  let sell_amount = ethers.parseUnits(sell_text, SELL_DECIMALS);

  console.log('balance     :', balance);
  console.log('allowance   :', allowance);
  console.log('sell amount :', sell_amount);

  // token not enough
  if (balance < sell_amount) {
    reset_swap_button();
    alert(`Insufficient ${SELL_SYMBOL} balance`);
    return;
  }
  // approve more allowance
  if (allowance < sell_amount) {
    try {
      let tx = await token_sell.getFunction('approve').send(CONTRACT_ADDR, sell_amount);
      let receipt = await tx.wait();
      if (receipt.status != 1) { // 1 success, 0 revert
        reset_swap_button();
        console.error('approve error', receipt);
        return;
      }
    }
    catch (error) {
      reset_swap_button();
      console.error('approve error', error);
      return;
    }
  }

  // swap
  contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, signer);
  swap_by_gas_rate(contract, sell_amount, MINT_GAS_RATE)
    .then(tx => {
      console.log(tx);
      return tx.wait();
    })
    .then(async receipt => { // https://docs.ethers.org/v6/api/providers/#TransactionReceipt
      console.log(receipt);
      $('#busy').addClass('d-none');
      if (receipt.status != 1) { // 1 success, 0 revert
        alert(JSON.stringify(receipt.toJSON()));
        $('#swap').removeClass('d-none');
        return;
      }
      if (TWEET_TEXT) tweet_modal.show();
      play_party_effect();
      $('.input input').val('');
      reset_swap_button();
      await update_token_balances();
    })
    .catch(e => {
      reset_swap_button();
      alert(e);
    });
});

if (window.ethereum) {
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
}

// web3 functions
async function update_token_balances() {
  $('.balance a').text('...');

  let balance_sell = await reader_sell.getFunction('balanceOf').staticCall(signer.address);
  let balance_buy = await reader_buy.getFunction('balanceOf').staticCall(signer.address);
  balance_sell = +ethers.formatUnits(balance_sell.toString(), SELL_DECIMALS);
  balance_buy = +ethers.formatUnits(balance_buy.toString(), BUY_DECIMALS);

  $('.sell .balance a').text(balance_sell);
  $('.buy .balance a').text(balance_buy);

  console.log(SELL_SYMBOL, ':', balance_sell);
  console.log(BUY_SYMBOL, ':', balance_buy);
}
function is_chain_ready(callback) {
  let ready = parseInt(raw_chain_id) == CHAIN_ID;
  if (ready && callback) callback();
  return ready;
}
function handle_chain_exception(err) {
  let msg = `Please change network to [${CHAIN_NAME}] before swap.`;
  alert(`${msg}\n\n----- Error Info -----\n[${err.code}] ${err.message}`);
  $('#connect').removeClass('disabled');
}
async function validate_chain() {
  // https://ethereum.stackexchange.com/questions/134610/metamask-detectethereumprovider-check-is-connected-to-specific-chain
  let { chainId } = await provider.getNetwork();
  raw_chain_id = chainId;
  let ok = is_chain_ready();
  let msg = ok ? null : `Please change network to [${CHAIN_NAME}] before swap.`;
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
async function swap_by_gas_rate(contract, sell_amount, gas_rate=1) {
  if (gas_rate == 1) {
    return contract.getFunction('buy').send(sell_amount);
  }
  else {
    let buy_fn = contract.getFunction('buy');
    let params = [ sell_amount ];
    let gas_limit = await buy_fn.estimateGas(...params);
    gas_limit = Math.ceil(Number(gas_limit) * gas_rate);
    return buy_fn.send(...params, { gasLimit: gas_limit });
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
function reset_swap_button() {
  $('#swap').removeClass('d-none');
  $('#busy').addClass('d-none');
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
let show_no_balance = _ => show_msg('Insufficient balance');
