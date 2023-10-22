const SNAPSHOT_URL = 'https://diewland.github.io/proof-cdn/claim/btac23voters.csv';
const TOKEN_PER_VOTE = 2.5;

function chunk_arr(array, chunk_size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunk_size) {
        chunks.push(array.slice(i, i + chunk_size));
    }
    return chunks;
}
async function load_snapshot() {
  let url = SNAPSHOT_URL + `?t=${+(new Date())}`;
  let data = await $.get(url);
  data = data.split('\n').filter(r => r).map(r => r.trim().split(','));

  console.log('snapshot data');
  console.log(data);

  let addrs = [];
  let amounts = [];
  data.forEach(r => {
    let vote = parseInt(r[7]);
    let amount = vote * TOKEN_PER_VOTE;
    addrs.push(r[0]);
    amounts.push(float2raw(amount));
  });

  console.log('addresses and amounts');
  console.log(addrs);
  console.log(amounts);

  if (contract !== null) {
    console.log('update contract recipients..');
    contract.getFunction('setRecipients').send(addrs, amounts);
  }
}
