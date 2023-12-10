$('.leaderboard tbody').html('');
for (let i=1; i<=1000; i++) {
  $('.leaderboard tbody').append(`
    <tr>
      <th scope="row">${i}</th>
      <td>0xcFa1Bf8CA39A89B6c0E9AFF55454B20e589c0dA0</td>
      <td>10</td>
      <td>0.01285</td>
      <td>Yes</td>
      <td>62500</td>
    </tr>
  `);
}
