function load_script(src, callback=null) {
  var script = document.createElement('script');
  script.src = src;
  if (callback) script.onload = callback;
  document.body.appendChild(script);
}
load_script('./config.js?t=' + +(new Date()), _  => { // 1. load config (no cache)
  load_script('../abi_v4.js', _ => {                  // 2. load contract abi
    load_script('../abi_erc20.js', _ => {             // 3. load erc20 abi
      load_script('../app_v4.js', _ => {              // 4. load app
        load_script('../snapshot_v4.js');             // 5. load snapshot
      });
    });
  });
});
