(() => {
  if (!('serviceWorker' in navigator)) return;

  const APP_VERSION = window.SITE_VERSION || 'unknown';
  const startedControlled = Boolean(navigator.serviceWorker.controller);
  let serviceWorkerRegistration = null;
  let waitingWorker = null;
  let pendingServerVersion = null;
  let dismissedWorker = null;
  let dismissedVersion = null;
  let reloadRequested = false;
  let reloadStarted = false;
  const watchedWorkers = new WeakSet();

  const reloadOnce = () => {
    if (reloadStarted) return;
    reloadStarted = true;
    window.location.reload();
  };

  const showUpdateToast = (worker, serverVersion) => {
    const activeWorker = worker || serviceWorkerRegistration?.waiting || null;
    const noticeVersion = serverVersion || pendingServerVersion || null;
    if (document.getElementById('sw-update-toast')) return;
    if (activeWorker && activeWorker === dismissedWorker) return;
    if (noticeVersion && noticeVersion === dismissedVersion) return;

    waitingWorker = activeWorker;
    const toast = document.createElement('div');
    toast.id = 'sw-update-toast';
    toast.className = 'sw-update-toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="sw-update-copy">
        <strong class="sw-update-title">網站有新版本</strong>
        <span class="sw-update-description">請重新整理載入最新版，避免看到舊版畫面或資料流程。</span>
      </div>
      <div class="sw-update-actions">
        <button class="sw-update-button" type="button">立即更新</button>
        <button class="sw-update-dismiss" type="button">稍後再說</button>
      </div>
    `;
    document.body.appendChild(toast);

    toast.querySelector('.sw-update-button').addEventListener('click', () => {
      reloadRequested = true;
      toast.remove();
      const workerToActivate = waitingWorker || serviceWorkerRegistration?.waiting || null;
      if (!workerToActivate) {
        reloadOnce();
        return;
      }
      try {
        workerToActivate.postMessage({ type: 'SKIP_WAITING' });
        // 正常路徑等待 controllerchange；極端瀏覽器無事件時留一個較寬鬆的保底。
        window.setTimeout(() => reloadOnce(), 8000);
      } catch {
        reloadOnce();
      }
    });

    toast.querySelector('.sw-update-dismiss').addEventListener('click', () => {
      dismissedWorker = activeWorker;
      dismissedVersion = noticeVersion;
      toast.remove();
    });
  };

  const watchWorker = (worker) => {
    if (!worker || watchedWorkers.has(worker)) return;
    watchedWorkers.add(worker);
    worker.addEventListener('statechange', () => {
      // 有舊 controller 才是更新，首次安裝不顯示更新通知。
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        showUpdateToast(worker, pendingServerVersion);
      }
    });
  };

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 首次安裝由 clients.claim() 接管時，不要強制重新整理。
    if (!startedControlled) return;
    if (reloadRequested) reloadOnce();
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type !== 'SW_ACTIVATED') return;
    // 首次安裝及本頁已按下更新，都不再多顯示一次通知。
    if (!startedControlled || reloadRequested) return;
    if (data.version && data.version === APP_VERSION) return;
    showUpdateToast(null, data.version || pendingServerVersion);
  });

  const checkVersion = async () => {
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.version || data.version === APP_VERSION) return;

      pendingServerVersion = data.version;
      if (serviceWorkerRegistration) {
        await serviceWorkerRegistration.update().catch(() => {});
        // 版本檔只負責觸發 update；等新版真的進 waiting 後才提示使用者。
        if (serviceWorkerRegistration.waiting && navigator.serviceWorker.controller) {
          showUpdateToast(serviceWorkerRegistration.waiting, data.version);
        }
      }
    } catch {
      // 離線或瀏覽器限制時，交由下一次 lifecycle / polling 再檢查。
    }
  };

  navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' })
    .then((registration) => {
      serviceWorkerRegistration = registration;
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateToast(registration.waiting, pendingServerVersion);
      }
      if (registration.installing) watchWorker(registration.installing);
      registration.addEventListener('updatefound', () => watchWorker(registration.installing));
    })
    .catch((error) => {
      console.warn('[SW] 註冊失敗（本機檔案模式可忽略）:', error);
    });

  ['focus', 'online', 'pageshow'].forEach((eventName) => {
    window.addEventListener(eventName, checkVersion);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkVersion();
  });
  window.setTimeout(checkVersion, 5000);
  window.setInterval(checkVersion, 3 * 60 * 1000);
})();
