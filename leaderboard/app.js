const SNAPSHOT_URL = 'https://bored-town.github.io/cdn/claim/btac23minttrade.csv';

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
  let new_chunk = q ? chunk.filter(r => r[1].indexOf(q) > -1) : chunk;
  $('.leaderboard tbody').html('');
  new_chunk.forEach(r => {
    let trade = 'soon' // TODO r[3];
    let bonus = r[4] == 'True' ? 'Yes' : 'No';
    $('.leaderboard tbody').append(`
      <tr>
        <th scope="row">${r[0]}</th>
        <td>${r[1]}</td>
        <td>${r[2]}</td>
        <td>${trade}</td>
        <td>${bonus}</td>
        <td>${r[5]}</td>
      </tr>
    `);
  });
}

let score_data = [];

$(async _ => {
  // load snapshot data
  score_data = await load_snapshot();
  let ts = score_data.shift();
  // render screen
  $('.last-modified').html(ts);
  render_table(score_data);
});

$('#btn-search').click(_ => {
  let q = $('#txt-search').val().trim();
  render_table(score_data, q);
});
