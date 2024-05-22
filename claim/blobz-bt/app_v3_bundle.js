function load_script(src, callback=null) {
  var script = document.createElement('script');
  script.src = src;
  if (callback) script.onload = callback;
  document.body.appendChild(script);
}
load_script('./config.js?t=' + +(new Date()), _  => { // 1. load config (no cache)
  load_script('../blobz-bt/abi.js', _ => {            // 2. load abi
    load_script('../blobz-bt/app_v3.js?r=20240522');  // 3. load app
  });
});
