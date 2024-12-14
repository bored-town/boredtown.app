// inject tier combobox
$('.card-title').append(`
<select class="tier float-end fs-6">
  <option value="op">OP Mainnet</option>
  <option value="zora">Zora</option>
  <option value="mode">Mode</option>
  <option value="arb">Arbitrum One</option>
  <option value="nova">Arbitrum Nova</option>
  <option value="metis">Metis</option>
</select>
`);

// get tier value from url
let current_tier = location.href.split('/')
                           .find(r => r.startsWith('rocketship-biz'))
                           .split('-')[2] || 'op';

// update combobox
$('.tier').val(current_tier).change(evt => {
  let t = $(evt.target).val();
  if (t == 'op')
    location.href = '../rocketship-biz/';
  else
    location.href = `../rocketship-biz-${t}/`;
});
