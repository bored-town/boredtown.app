<?php
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // require address from query string
    $addr = null;
    if (isset($_GET['addr'])) {
        $addr = strtolower($_GET['addr']); // force to lowercase
    }
    else {
      http_response_code(404);
      return;
    }

    // proof data (lowercase key)
    $proof_data = array(
      '0xcfa1bf8ca39a89b6c0e9aff55454b20e589c0da0' => array(
          '0x25d30d1a56c48bd85a59d1446a839595667a11e957f158765778980b4551497c',
          '0x394cef7a3492d7f89b74c9d3e6cee9bd1562c3c6af1e9dc7e36d1967c679db21',
          '0x584cd0a2190967a1b11905f6ff356590cb76f7cfcac554aba72379334011eeeb',
          '0x1904fb867183d5ba3abf1c73c23891d784dc40cf2be5affe4c331388bb2c9b11',
          '0xc39fd2d37161ff0b27fd9d1ce49a1eec16b925c748942e29cd91bcfbe6674492',
          '0xf57dc664397a68f98a7d44f0097ccf5ef8e523beec6a099cb2639d3f3b8b6c99',
          '0xcc0c93bb529bcfad56d3cc0cb98891d62ae20cd5de9c34d11debd9a352df52f3',
          '0x1786d240570a2215ee6da1ddfb7155fbc41eaad112452aeeab9aa996b25b57e3',
          '0xe64eff82ef7bb53632419a3d725620e229b4500e58b50c9b13651b692df60cb7',
          '0x37c39b2e6036d2450a12480f5be00712e16600c3fcb6f4d5fea47de86a12c1a0',
          '0x93087ec8d6b2224adb3d65b1db9e5515b64a1136c0a5c9fb81c85eb459270868',
          '0x6f3a9d9b9fd2414ef0e6724298a52a894d1045b48345c190242cb9aefabf9cd5',
          '0xa9731e57f1409781202ab1cbe7a0de39b3b2ded22c0c724459287f2280822b72',
      ),
      // ...
    );

    // craft response
    $data = array(
        'proof' => $proof_data[$addr] ?? array(),
    );

    // return
    header('Content-Type: application/json');
    echo json_encode($data);

} else {
    http_response_code(405); // method not allowed
}
?>
