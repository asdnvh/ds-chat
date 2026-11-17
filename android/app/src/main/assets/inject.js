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
    var menu = null;
    var timer = null;
    function closeMenu() {
      if (menu) {
        menu.remove();
        menu = null;
      }
    }
    function showMenu() {
      if (menu) {
        return;
      }
      menu = document.createElement('div');
      menu.style.cssText =
        'position:absolute;left:50%;bottom:48px;transform:translateX(-50%);background:#2b2b2b;' +
        'color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.4)';
      var save = document.createElement('button');
      save.type = 'button';
      save.textContent = '保存图片';
      save.style.cssText = 'display:block;padding:14px 30px;background:none;border:0;color:#fff;font-size:15px';
      save.addEventListener('click', function (event) {
        event.stopPropagation();
        closeMenu();
        try {
          if (native && native.saveImage) {
            native.saveImage(image.src, 'image-' + Date.now() + '.jpg');
          }
        } catch (e) {
          // 忽略
        }
      });
      menu.appendChild(save);
      wrapper.appendChild(menu);
    }
    // 点图片本身不关闭；点周边空白处关闭
    image.addEventListener('click', function (event) {
      event.stopPropagation();
      closeMenu();
    });
    wrapper.addEventListener('click', function (event) {
      if (event.target === wrapper) {
        closeOverlay();
      }
    });
    image.addEventListener(
      'touchstart',
      function () {
        timer = setTimeout(showMenu, 550);
      },
      { passive: true }
    );
    image.addEventListener('touchend', function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
    image.addEventListener('touchmove', function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
    image.addEventListener('contextmenu', function (event) {
      event.preventDefault();
      showMenu();
    });
    document.body.appendChild(wrapper);
    overlay = wrapper;
    notifyOverlay(true);
  }

  window.__dsShowImageOverlay = showImageOverlay;

  // 文件卡片长按分享：把 blob 读成 base64 交给原生系统分享弹窗
  window.__dsChatShareFile = function (url, name) {
    try {
      fetch(url)
        .then(function (response) {
          return response.blob();
        })
        .then(function (blob) {
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var dataUrl = String(reader.result);
              var comma = dataUrl.indexOf(',');
              if (native && native.shareFile) {
                native.shareFile(dataUrl.slice(comma + 1), blob.type || 'application/octet-stream', name);
              }
            } catch (e) {
              // 忽略
            }
          };
          reader.readAsDataURL(blob);
        });
    } catch (e) {
      // 忽略
    }
  };

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

  // ---------------------------------------------------------------------------
  // 4. 导入历史对话提示
  //    导入要在本机解压 ZIP 并逐条写入数据库，会话多/图片大时需要几十秒甚至更久。
  //    用户点「确认导入」后弹一条原生 Toast 告知正在处理，完成/失败时再提示一次，
  //    避免误以为卡死而中途退出。只读取界面文本，不改变任何导入逻辑。
  // ---------------------------------------------------------------------------
  function toastLong(message) {
    try {
      if (native && native.toastLong) {
        native.toastLong(message);
      } else if (native && native.toast) {
        native.toast(message);
      }
    } catch (e) {
      // 忽略
    }
  }

  var IMPORT_START_ZH = '确认导入';
  var IMPORT_START_EN = 'Import';
  var DONE_PATTERN = /已导入\s*(\d+)\s*个对话|Imported\s+(\d+)\s+chats?/;
  var importWatch = null;

  function startImportWatch() {
    if (importWatch) {
      return;
    }
    var baseline = document.body ? document.body.innerText : '';
    var baselineMatch = DONE_PATTERN.exec(baseline);
    var baselineDone = baselineMatch ? baselineMatch[0] : null;
    var startedAt = Date.now();
    toastLong('正在导入历史对话，请稍候…会话多时可能需要几十秒，请不要退出应用');
    importWatch = setInterval(function () {
      var text = document.body ? document.body.innerText : '';
      var done = DONE_PATTERN.exec(text);
      if (done && done[0] !== baselineDone) {
        clearInterval(importWatch);
        importWatch = null;
        toastLong('导入完成：' + (done[1] || done[2]) + ' 个对话');
        return;
      }
      if (text.indexOf('文件导入失败') >= 0 || text.indexOf('File import failed') >= 0) {
        clearInterval(importWatch);
        importWatch = null;
        toastLong('导入失败，请检查文件格式或重新导出后再试');
        return;
      }
      if (Date.now() - startedAt > 6 * 60 * 1000) {
        clearInterval(importWatch);
        importWatch = null;
      }
    }, 1500);
  }

  document.addEventListener(
    'click',
    function (event) {
      var button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button) {
        return;
      }
      var label = (button.textContent || '').trim();
      if (label === IMPORT_START_ZH) {
        startImportWatch();
        return;
      }
      if (
        label === IMPORT_START_EN &&
        document.body &&
        document.body.innerText.indexOf('Import chat history?') >= 0
      ) {
        startImportWatch();
      }
    },
    true
  );
})();

  // 图片搜索等远程图片：点击后用内置浮层预览（与 blob 图片预览一致）
  document.addEventListener(
    'click',
    function (event) {
      var target = event.target;
      if (!target || !target.closest) {
        return;
      }
      var image = target.closest('img[data-ds-image-preview]');
      if (!image || !image.src) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.__dsShowImageOverlay === 'function') {
        window.__dsShowImageOverlay(image.src);
      }
    },
    true
  );
  // 原生 PDF 阅读器入口：经由注入脚本调用桥接（直接调用偶发 non-injected object）
  window.__dsChatOpenPdf = function (base64, name) {
    try {
      native.openPdf(base64, name);
      return true;
    } catch (e) {
      try {
        window.DSChatNative.openPdf(base64, name);
        return true;
      } catch (e2) {
        return false;
      }
    }
  };