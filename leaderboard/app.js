const SNAPSHOT_URL = 'https://bored-town.github.io/op-airdrop4/master.csv'
const ITEM_LIMIT   = 1_000;

function chunk_arr(array, chunk_size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunk_size) {
        chunks.push(array.slice(i, i + chunk_size));
    }
    return chunks;
}

async function load_snapshot(chunk_index=null, chunk_size=1000) {
  let url = SNAPSHOT_URL + `?t=${+(new Date())}`;
  let data = await $.get(url);
  data = data.split('\n').filter(r => r).map(r => r.trim().split(','));
  if (chunk_index != null) {
    data = chunk_arr(data, chunk_size)[chunk_index];
  }
  console.log('snapshot data');
  console.log(data);
  return data;
}

function render_table(chunk, q) {
  let html = '';
  let new_chunk = q
    ? chunk.filter(r => r[1].toLowerCase().indexOf(q.toLowerCase()) > -1)
    : chunk;
  new_chunk = new_chunk.slice(0, ITEM_LIMIT); // top N addresses
  new_chunk.forEach(r => {
    let fields = '';
    for (let i=4; i<=22; i++) {
      fields += `<td>${r[i]}</td>`;
    }
    html += `
      <tr>
        <th scope="row">${r[0]}</th>
        <td>${r[1]}</td>
        <td class="text-warning">${r[3]}</td>
        ${fields}
      </tr>
    `;
  });
  $('.leaderboard tbody').html(html);
}

let score_data = [];

$(async _ => {
  // load snapshot data
  score_data = await load_snapshot();
  let ts = score_data.shift();
  // remove loading
  $('.loading').addClass('d-none');
  $('.table-responsive').removeClass('d-none');
  // render screen
  let sync_text = `Top ${ITEM_LIMIT} of ${score_data.length} addresses`;
  $('.last-modified').html(sync_text);
  render_table(score_data);
});

$('#btn-search').click(_ => {
  let q = $('#txt-search').val().trim();
  render_table(score_data, q);
});
