(function () {
  if (window.__dsChatAndroidInjected) {
    return;
  }
  window.__dsChatAndroidInjected = true;
  var native = window.DSChatNative;

  // ---------------------------------------------------------------------------
  // 1. 记录导出文件名（应用通过 <a download="历史记录.zip"> 触发下载）
  // ---------------------------------------------------------------------------
  var anchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try {
      if (this.download) {
        window.__dsChatDownloadName = this.download;
      }
    } catch (e) {
      // 忽略
    }
    return anchorClick.apply(this, arguments);
  };

  // ---------------------------------------------------------------------------
  // 2. 主题色同步到系统状态栏 / 导航栏
  //    应用会随深浅色主题更新 <meta name="theme-color">，这里监听变化后交给原生。
  // ---------------------------------------------------------------------------
  function toHex(color) {
    var match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(color || '');
    if (!match) {
      return color;
    }
    var parts = [match[1], match[2], match[3]].map(function (value) {
      var hex = parseInt(value, 10).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    });
    return '#' + parts.join('');
  }

  function syncThemeColor(meta) {
    if (!native || !native.setThemeColor || !meta) {
      return;
    }
    try {
      native.setThemeColor(toHex(meta.getAttribute('content') || ''));
    } catch (e) {
      // 忽略
    }
  }

  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    new MutationObserver(function () {
      syncThemeColor(themeMeta);
    }).observe(themeMeta, { attributes: true, attributeFilter: ['content'] });
    syncThemeColor(themeMeta);
    window.addEventListener('load', function () {
      syncThemeColor(themeMeta);
    });
  }

  // ---------------------------------------------------------------------------
  // 3. blob: 文件
  //    WebView 无法像浏览器那样在“新窗口”里打开 blob: URL，因此：
  //     - 图片：用内置全屏浮层预览（点击关闭，返回键也可关闭）
  //     - 其它文件：通过原生桥接保存到系统下载目录
  // ---------------------------------------------------------------------------
  var overlay = null;

  function notifyOverlay(open) {
    try {
      if (native && native.setOverlayOpen) {
        native.setOverlayOpen(open);
      }
    } catch (e) {
      // 忽略
    }
  }

  function closeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
      notifyOverlay(false);
    }
  }

  window.__dsChatCloseOverlay = closeOverlay;

  function saveBlob(blob) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var dataUrl = String(reader.result);
        var comma = dataUrl.indexOf(',');
        var mime = blob.type || 'application/octet-stream';
        var name = window.__dsChatDownloadName;
        if (!name) {
          var extension = mime.indexOf('/') >= 0 ? mime.split('/')[1] : '';
          extension = extension.replace(/[^a-z0-9]/gi, '').slice(0, 8);
          name = 'chat-demo-' + Date.now() + (extension ? '.' + extension : '');
        }
        native.saveDownload(dataUrl.slice(comma + 1), mime, name);
      } catch (e) {
        // 忽略
      }
    };
    reader.readAsDataURL(blob);
  }

  function showImageOverlay(dataUrl) {
    var wrapper = document.createElement('div');
    wrapper.setAttribute('data-chat-demo-overlay', '1');
    wrapper.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.92);' +
      'display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box';
    var image = document.createElement('img');
    image.src = dataUrl;
    image.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:4px';
    wrapper.appendChild(image);
    wrapper.addEventListener('click', closeOverlay);
    document.body.appendChild(wrapper);
    overlay = wrapper;
    notifyOverlay(true);
  }

  function openBlob(url) {
    fetch(url)
      .then(function (response) {
        return response.blob();
      })
      .then(function (blob) {
        if (blob.type && blob.type.indexOf('image/') === 0) {
          var reader = new FileReader();
          reader.onload = function () {
            showImageOverlay(String(reader.result));
          };
          reader.readAsDataURL(blob);
        } else {
          saveBlob(blob);
        }
      })
      .catch(function () {
        // 忽略：blob 已失效
      });
  }

  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      var anchor = target && target.closest ? target.closest('a[href^="blob:"]') : null;
      if (anchor) {
        event.preventDefault();
        event.stopPropagation();
        openBlob(anchor.getAttribute('href'));
      }
    },
    true
  );

  var nativeOpen = window.open;
  window.open = function (url) {
    if (typeof url === 'string' && url.indexOf('blob:') === 0) {
      openBlob(url);
      return null;
    }
    return nativeOpen.apply(window, arguments);
  };
})();
