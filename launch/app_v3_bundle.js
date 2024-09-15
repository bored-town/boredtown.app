function load_script(src, callback=null) {
  var script = document.createElement('script');
  script.src = src;
  if (callback) script.onload = callback;
  document.body.appendChild(script);
}
load_script('./config.js?t=' + +(new Date()), _  => { // 1. load config (no cache)
  load_script('../abi_v3.js', _ => {                  // 2. load abi
    load_script('../app_v3.js?t=20240915');           // 3. load app
  });
});
