// inject combobox
$('.card-title').append(`
<select class="tier float-end">
  <option value="s">Tier S</option>
  <option value="a">Tier A</option>
  <option value="b">Tier B</option>
  <option value="c">Tier C</option>
</select>
`);

// set tier
let current_tier = location.href.split('/').find(r => r.startsWith('space-blobz')).split('-')[2] || 's';
$('.tier').val(current_tier);

// bind change event
$('.tier').change(evt => {
  let t = $(evt.target).val();
  if (t == 's')
    location.href = '../space-blobz/';
  else
    location.href = `../space-blobz-${t}/`;
});
