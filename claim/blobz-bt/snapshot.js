function chunk_arr(array, chunk_size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunk_size) {
        chunks.push(array.slice(i, i + chunk_size));
    }
    return chunks;
}
async function load_snapshot(chunk_index=null, chunk_size=1_000, remove_header=true) {
  let url = SNAPSHOT_URL + `?t=${+(new Date())}`;
  let data = await $.get(url);
  data = data.split('\n').filter(r => r).map(r => r.trim().split(','));
  if (remove_header) data.shift();
  if (chunk_index != null) {
    data = chunk_arr(data, chunk_size)[chunk_index];
  }
  console.log('snapshot data');
  console.log(data);

  let addrs = [];
  let amounts = [];
  data.forEach(r => {
    let amount = +r[2]; // 1M unit
    addrs.push(r[1]);
    amounts.push(amount);
  });

  console.log('addresses and amounts');
  console.log(addrs);
  console.log(amounts);

  if (contract !== null) {
    console.log('update contract recipients..');
    contract.getFunction('setRecipients').send(addrs, amounts);
  }
}
