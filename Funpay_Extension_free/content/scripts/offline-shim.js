// offline-shim.js
// Вставляется в контекст страницы (page context) и перехватывает сетевые вызовы.
(function(){
  // Список доменов для блокировки — по умолчанию блокируем внешний бэкенд и гугл переводчик.
  // Если в localStorage включён demo_mode ('1'), то не блокируем `fpextension.biz` —
  // это позволит демонстрации полноценно работать (визуально включённые функции будут делать запросы).
  let BLOCKED_DOMAINS = ['fpextension.biz', 'translate.googleapis.com'];
  try {
    const demo = localStorage.getItem('demo_mode') === '1';
    if (demo) {
      BLOCKED_DOMAINS = ['translate.googleapis.com'];
    }
  } catch (e) { /* если доступ к localStorage невозможен — оставляем дефолт */ }

  function hostnameOf(url){
    try{ return new URL(url, location.href).hostname; }catch(e){ return ''; }
  }

  function isBlocked(url){
    if(!url) return false;
    const h = hostnameOf(url);
    if(!h) return false;
    return BLOCKED_DOMAINS.some(d => h === d || h.endsWith('.' + d));
  }

  // Expose config for quick runtime tweaking from devtools
  window.__OFFLINE_SHIM = window.__OFFLINE_SHIM || {};
  window.__OFFLINE_SHIM.blocked = BLOCKED_DOMAINS;

  // --- fetch ---
  try{
    const _fetch = window.fetch;
    window.fetch = function(input, init){
      const url = typeof input === 'string' ? input : (input && input.url);
      const demoMode = (function(){ try{ return localStorage.getItem('demo_mode') === '1' }catch(e){return false} })();
      // Mock runner responses in demo mode so demo works without external server
      try {
        if (demoMode && url && url.indexOf('fpextension.biz') !== -1 && url.indexOf('/runner') !== -1) {
          // parse body to detect action
          let action = null;
          if (init && init.body) {
            try {
              const params = new URLSearchParams(init.body);
              action = params.get('action') || null;
            } catch(e){ /* ignore */ }
          }

          if (action === 'analitik') {
            const mock = {
              count: 42,
              'max-price': '1 999',
              'min-price': '100',
              average: '550',
              'individual-sellers': 23,
              'ruble-plus': 1,
              'verified-sellers': 7
            };

            return Promise.resolve(new Response(JSON.stringify(mock), { status: 200, headers: { 'Content-Type': 'application/json' } }));
          }

          if (action === 'panel') {
            const html = `
              <div class="panel-product">
                <div class="product-title">Демо товар</div>
                <div class="product-price">100.00 руб</div>
                <button class="set-price">Установить цену</button>
              </div>
            `;

            return Promise.resolve(new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } }));
          }

          // generic mock for other actions
          return Promise.resolve(new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        }
      } catch(e) { /* mock failed, fall through to real fetch */ }
      if(isBlocked(url)){
        console.warn('[offline-shim] blocked fetch ->', url);
        return Promise.resolve(new Response(JSON.stringify({offline:true, url}), {status:200, headers:{'Content-Type':'application/json'}}));
      }
      return _fetch.apply(this, arguments);
    };
  }catch(e){ console.warn('[offline-shim] fetch patch failed', e); }

  // --- XMLHttpRequest --- override open/send to detect URL
  try{
    const XProto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if(XProto){
      const _open = XProto.open;
      const _send = XProto.send;
      XProto.open = function(method, url){
        try{ this.__offlineShimUrl = url; }catch(e){}
        return _open.apply(this, arguments);
      };
      XProto.send = function(body){
        try{
          if(isBlocked(this.__offlineShimUrl)){
            console.warn('[offline-shim] blocked XHR ->', this.__offlineShimUrl);
            // имитируем ошибку запроса
            try{ this.abort(); }catch(e){}
            if(typeof this.onerror === 'function'){
              try{ this.onerror(new Error('blocked by offline-shim')); }catch(e){}
            }
            return;
          }
        }catch(e){}
        return _send.apply(this, arguments);
      };
    }
  }catch(e){ console.warn('[offline-shim] XHR patch failed', e); }

  // --- WebSocket ---
  try{
    const _WS = window.WebSocket;
    if(_WS){
      function PatchedWebSocket(url, protocols){
        if(isBlocked(url)){
          console.warn('[offline-shim] blocked WebSocket ->', url);
          // Возвращаем объект с совместимыми заглушками
          const fake = {};
          fake.readyState = 3; // CLOSED
          fake.send = function(){};
          fake.close = function(){};
          fake.addEventListener = fake.removeEventListener = function(){};
          return fake;
        }
        return new _WS(url, protocols);
      }
      PatchedWebSocket.prototype = _WS.prototype;
      window.WebSocket = PatchedWebSocket;
    }
  }catch(e){ console.warn('[offline-shim] WebSocket patch failed', e); }

  // --- navigator.sendBeacon ---
  try{
    if(navigator && navigator.sendBeacon){
      const _beacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function(url, data){
        if(isBlocked(url)){
          console.warn('[offline-shim] blocked sendBeacon ->', url);
          return false;
        }
        return _beacon(url, data);
      };
    }
  }catch(e){ /* ignore */ }

  console.info('[offline-shim] initialized, blocked domains:', BLOCKED_DOMAINS);
})();
