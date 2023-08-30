let app    = '../app_v2_gas11.js';
let config = './config.js?t=' + +(new Date()); // no cache

function load_script(src, callback=null) {
  var script = document.createElement('script');
  script.src = src;
  if (callback) script.onload = callback;
  document.body.appendChild(script);
}
load_script(config, _  => { load_script(app) }); // load config -> app
