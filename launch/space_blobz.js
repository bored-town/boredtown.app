// inject tier combobox
$('.card-title').append(`
<select class="tier float-end">
  <option value="s">Tier S 🏷️ 10B</option>
  <option value="a">Tier A 🏷️ 1B</option>
  <option value="b">Tier B 🏷️ 100M</option>
  <option value="c">Tier C 🏷️ 10M</option>
</select>
`);

// get tier value from url
let current_tier = location.href.split('/')
                           .find(r => r.startsWith('space-blobz'))
                           .split('-')[2] || 's';

// update combobox
$('.tier').val(current_tier).change(evt => {
  let t = $(evt.target).val();
  if (t == 's')
    location.href = '../space-blobz/';
  else
    location.href = `../space-blobz-${t}/`;
});
