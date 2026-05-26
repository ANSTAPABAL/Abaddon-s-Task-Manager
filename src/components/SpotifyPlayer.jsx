import React, { useState, useEffect, useRef } from 'react';
import { Music, RefreshCw, Key, Power, Play, Pause, SkipForward, Radio, Activity } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';

export default function SpotifyPlayer({ 
  character, 
  spotifyToken, 
  setSpotifyToken, 
  currentTrack, 
  setCurrentTrack,
  activeSessionType
}) {
  const { setSpotifyPlaying } = useAudio();
  const [clientId, setClientId] = useState(() => localStorage.getItem('spotify_client_id') || '');
  const [deviceId, setDeviceId] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const exchangeInProgress = useRef(false);
  const [diagnosticsLog, setDiagnosticsLog] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const fetchDevices = async () => {
    if (!spotifyToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const foundDevices = data.devices || [];
        setDevices(foundDevices);
        
        // Auto-select active device or local device if nothing is selected
        setSelectedDeviceId(prev => {
          if (prev && foundDevices.some(d => d.id === prev)) return prev;
          const activeDev = foundDevices.find(d => d.is_active);
          if (activeDev) return activeDev.id;
          if (deviceId) return deviceId;
          if (foundDevices.length > 0) return foundDevices[0].id;
          return '';
        });
      }
    } catch (e) {
      console.warn("Failed to fetch available devices:", e);
    }
  };

  useEffect(() => {
    if (spotifyToken) {
      fetchDevices();
      const interval = setInterval(fetchDevices, 10000);
      return () => clearInterval(interval);
    }
  }, [spotifyToken, deviceId]);

  // Sync isPlaying to synth drone muting
  useEffect(() => {
    setSpotifyPlaying(isPlaying);
  }, [isPlaying, setSpotifyPlaying]);

  // Check token age on load
  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    const createdAt = localStorage.getItem('spotify_token_created_at');
    if (token && createdAt) {
      const elapsed = Date.now() - Number(createdAt);
      if (elapsed > 3300 * 1000) { // 55 minutes
        console.log("Spotify token expired by age check on startup, clearing...");
        localStorage.removeItem('spotify_token');
        localStorage.removeItem('spotify_token_created_at');
        setSpotifyToken('');
      }
    }
  }, [setSpotifyToken]);

  // Focus playlists custom state (user can paste their own Spotify URI links!)
  const [playlists, setPlaylists] = useState({
    escape: 'spotify:playlist:37i9dQZF1DX1YQO4sw348m', // Dark Ambient (Verified Public)
    hunt: 'spotify:playlist:37i9dQZF1DWWQRwui0EXPn', // Atmospheric Sci-Fi Focus (Verified Public)
    siege: 'spotify:playlist:37i9dQZF1DX5cZuGC1e3tn', // Industrial / Heavy Electronic Focus (Verified Public)
    deconstruct: 'spotify:playlist:37i9dQZF1DXb4nC925ve47', // Psychedelic Chill (Verified Public)
    recovery: 'spotify:playlist:37i9dQZF1DX8NTLI297vKT', // Soft Medieval Lutes & Cozy Chill (Verified Public)
    quiet_focus: 'spotify:playlist:37i9dQZF1DWZeKFBTSLg3N' // Deep Focus Drones / Ambient (Verified Public)
  });

  // --- CRYPTO HELPER METHODS FOR PKCE ---
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values).reduce((acc, x) => acc + possible[x % possible.length], '');
  };

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  };

  const base64urlencode = (a) => {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  // --- OAUTH WORKFLOW ---
  const handleConnectSpotify = async () => {
    if (!clientId.trim()) {
      alert("Сначала введите Spotify Client ID! Получите его в Spotify Developer Dashboard.");
      return;
    }
    localStorage.setItem('spotify_client_id', clientId);

    const codeVerifier = generateRandomString(64);
    window.sessionStorage.setItem('spotify_code_verifier', codeVerifier);

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64urlencode(hashed);

    const redirectUri = window.location.origin;
    const scope = 'user-modify-playback-state user-read-playback-state streaming user-read-currently-playing user-read-email user-read-private';

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    const params = {
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  // Capture callback code in URL
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    const verifier = window.sessionStorage.getItem('spotify_code_verifier');
    const savedClientId = localStorage.getItem('spotify_client_id');

    if (code && verifier && savedClientId && !exchangeInProgress.current) {
      exchangeInProgress.current = true;
      const exchangeCodeForToken = async () => {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: savedClientId,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: window.location.origin,
              code_verifier: verifier
            })
          });

          if (!response.ok) throw new Error("Failed token exchange");
          const data = await response.json();
          localStorage.setItem('spotify_token_created_at', Date.now().toString());
          setSpotifyToken(data.access_token);
          // clean URL parameters
          window.history.replaceState({}, document.title, window.location.origin);
        } catch (e) {
          console.error("Spotify OAuth Token Exchange Error:", e);
        } finally {
          exchangeInProgress.current = false;
        }
      };
      exchangeCodeForToken();
    }
  }, [setSpotifyToken]);

  // --- WEB PLAYBACK SDK ---
  useEffect(() => {
    if (!spotifyToken) return;

    // If Spotify is already loaded, set SDK loaded directly
    if (window.Spotify && window.Spotify.Player) {
      setSdkLoaded(true);
      return;
    }

    // Set or chain the SDK ready callback
    const prevCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      if (prevCallback) prevCallback();
      setSdkLoaded(true);
    };

    // Load Spotify Playback SDK script dynamically if not already present
    if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [spotifyToken]);

  // Initialize Spotify Player when SDK is ready
  useEffect(() => {
    if (!sdkLoaded || !spotifyToken) return;

    const newPlayer = new window.Spotify.Player({
      name: "Abaddon's Focus Vessel",
      getOAuthToken: cb => { cb(spotifyToken); },
      volume: 0.5
    });

    newPlayer.addListener('ready', ({ device_id }) => {
      console.log('Spotify Device Ready: ', device_id);
      setDeviceId(device_id);
      setSelectedDeviceId(prev => prev || device_id);
      setIsPlayerActive(true);
      
      // Auto-transfer playback to this browser device with a delay to prevent race conditions
      setTimeout(async () => {
        try {
          const res = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [device_id], play: false })
          });
          if (res.ok) {
            console.log("Successfully transferred playback device automatically.");
          } else {
            console.warn(`Playback transfer failed with status: ${res.status}`);
          }
        } catch (e) {
          console.warn("Could not transfer playback device automatically:", e);
        }
      }, 1500);
    });

    newPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
    });

    // Add authentication error listeners to auto-reauth expired tokens
    newPlayer.addListener('authentication_error', ({ message }) => {
      console.error('Spotify SDK Authentication Error:', message);
      setSpotifyError("Сессия Spotify истекла. Пожалуйста, переподключите аккаунт.");
      setSpotifyToken('');
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_token_created_at');
    });

    newPlayer.addListener('account_error', ({ message }) => {
      console.error('Spotify SDK Account Error (Premium Required):', message);
      setSpotifyError("Для работы плеера требуется подписка Spotify Premium. Автоматический запуск треков приостановлен.");
      setDisableAutoPlay(true);
    });

    newPlayer.addListener('initialization_error', ({ message }) => {
      console.error('Spotify SDK Initialization Error:', message);
    });

    newPlayer.connect();
    setPlayer(newPlayer);

    return () => {
      newPlayer.removeListener('ready');
      newPlayer.removeListener('player_state_changed');
      newPlayer.removeListener('authentication_error');
      newPlayer.removeListener('account_error');
      newPlayer.removeListener('initialization_error');
      newPlayer.disconnect();
      setPlayer(null);
    };
  }, [sdkLoaded, spotifyToken]);

  const [spotifyError, setSpotifyError] = useState('');
  const [disableAutoPlay, setDisableAutoPlay] = useState(false);

  // --- SYNC AUDIO PLAYBACK WITH STATE COGNITION ---
  const handlePlayAtmosphere = async (mood) => {
    if (!spotifyToken || !selectedDeviceId) {
      setSpotifyError("Устройство Focus Vessel или выбранный плеер еще не готовы...");
      setTimeout(() => setSpotifyError(''), 6000);
      return;
    }

    const playlistUri = playlists[mood] || playlists.quiet_focus;
    const playlistId = playlistUri.split(':').pop();

    const makePlayRequest = async (targetDeviceId = null, useTracks = false, trackUris = null) => {
      const url = targetDeviceId 
        ? `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`
        : `https://api.spotify.com/v1/me/player/play`;
        
      const body = useTracks && trackUris && trackUris.length > 0
        ? { uris: trackUris }
        : { context_uri: playlistUri };

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        let errMessage = `HTTP error ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error && errData.error.message) {
            errMessage = errData.error.message;
          }
        } catch (_) {}
        const error = new Error(errMessage);
        error.status = res.status;
        throw error;
      }
    };

    const fetchPlaylistTracks = async () => {
      try {
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/items?limit=100`, {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });
        if (!res.ok) {
          console.warn(`Failed to fetch playlist items: HTTP ${res.status}`);
          return null;
        }
        const data = await res.json();
        if (!data || !data.items) {
          console.warn("Playlist items request returned empty or invalid data:", data);
          return null;
        }
        
        // Extract valid track URIs (ignoring local files or invalid tracks)
        const uris = data.items
          .map(item => item?.track?.uri)
          .filter(uri => uri && uri.startsWith('spotify:track:'));
          
        if (uris.length === 0) return null;
        
        // Shuffle the tracks to start with a fresh random song each time
        const shuffled = [...uris];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      } catch (e) {
        console.warn("Failed to fetch playlist tracks for bypass:", e);
        return null;
      }
    };

    // Helper to ensure target device is registered and active in Spotify Connect
    const ensureDeviceActive = async (targetDeviceId) => {
      try {
        console.log(`Checking if device ${targetDeviceId} is active in Spotify Connect...`);
        const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const device = data.devices?.find(d => d.id === targetDeviceId);
        
        if (!device || !device.is_active) {
          console.log(`Target device ${targetDeviceId} is not active or not registered. Forcing active playback transfer...`);
          await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${spotifyToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [targetDeviceId], play: false })
          });
          // Wait 1200ms for backend synchronization
          await new Promise(resolve => setTimeout(resolve, 1200));
        } else {
          console.log("Target device is already registered and active.");
        }
      } catch (err) {
        console.warn("Self-healing device transfer failed:", err);
      }
    };

    try {
      // 1. Self-heal device status (ensure it is registered and active in Spotify Connect)
      await ensureDeviceActive(selectedDeviceId);

      try {
        // Attempt 1: Native Playlist Playback (Directly send context_uri to selected device)
        // This is 100% reliable for Premium, fast, preserves shuffle/repeat, doesn't load network
        await makePlayRequest(selectedDeviceId, false, null);
        setIsPlaying(true);
        setSpotifyError('');
      } catch (e) {
        console.warn("Direct native context_uri play attempt failed, trying track URIs bypass...", e.message);
        
        try {
          // Attempt 2: Fetch tracks to bypass standard restrictions if native play failed
          const trackUris = await fetchPlaylistTracks();
          if (!trackUris) throw new Error("Could not fetch playlist track URIs");
          
          await makePlayRequest(selectedDeviceId, true, trackUris);
          setIsPlaying(true);
          setSpotifyError('');
        } catch (retryError) {
          console.warn("Track URIs bypass play attempt failed, trying active device fallback...", retryError.message);
          
          try {
            // Attempt 3: Try playing without specifying a device ID (targets active device in Spotify Connect)
            await makePlayRequest(null, false, null);
            setIsPlaying(true);
            setSpotifyError('');
          } catch (finalError) {
            const status = finalError.status;
            const msg = finalError.message ? finalError.message.toLowerCase() : "";
            
            if (status === 403 || msg.includes("restriction") || msg.includes("premium")) {
              console.warn("Spotify Playback blocked (Premium restriction or Dev access missing):", finalError.message);
            } else {
              console.error("Spotify Playback Error after recovery:", finalError);
            }
            
            let userFriendlyError = "Не удалось запустить трек. Запустите Spotify Premium на ПК/телефоне и попробуйте снова!";
            
            if (status === 401 || msg.includes("token expired") || msg.includes("401")) {
              userFriendlyError = "Срок действия токена Spotify истек. Пожалуйста, переподключите аккаунт!";
              setSpotifyToken(''); // Clear the expired token so user can connect again
            } else if (status === 403 || msg.includes("premium") || msg.includes("403") || msg.includes("restriction")) {
              if (msg.includes("restriction")) {
                userFriendlyError = `Ошибка 403 (Ограничение): Плеер не активен или требуется Premium. Пожалуйста, откройте официальное приложение Spotify на телефоне/ПК, запустите любой трек и переключите устройство вывода на "Abaddon's Focus Vessel". (Детали: "${finalError.message}").`;
              } else {
                userFriendlyError = `Ошибка 403 (Ограничение): Требуется подписка Spotify Premium ИЛИ ваш аккаунт должен быть добавлен в список 'Users and Access' в настройках приложения на Spotify Dashboard. (Детали: "${finalError.message}"). Автоматический запуск треков отключен.`;
              }
              setDisableAutoPlay(true);
            } else if (status === 404 || msg.includes("device") || msg.includes("404")) {
              userFriendlyError = "Устройство Focus Vessel не найдено или не готово. Убедитесь, что Spotify Premium запущен на ПК или телефоне!";
            } else if (finalError.message) {
              userFriendlyError = `Ошибка Spotify: ${finalError.message}. Откройте плеер на ПК/телефоне и попробуйте снова.`;
            }
            
            setSpotifyError(userFriendlyError);
            setTimeout(() => setSpotifyError(''), 10000);
          }
        }
      }
    } catch (outerError) {
      console.error("Outer play atmosphere error:", outerError);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticsLog("Запуск диагностики...\n");
    setShowDiagnostics(true);
    
    let log = "=== ОТЛАДКА SPOTIFY CONNECT ===\n";
    try {
      log += "1. Получение профиля пользователя (GET /v1/me)...\n";
      const meRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
      if (!meRes.ok) throw new Error(`Ошибка GET /me: ${meRes.status}`);
      const meData = await meRes.json();
      log += `   > Имя: ${meData.display_name}\n`;
      log += `   > Страна: ${meData.country}\n`;
      log += `   > Подписка (Product): "${meData.product}"\n`;
      if (meData.product !== 'premium') {
        log += "   ⚠️ ВНИМАНИЕ: Ваш аккаунт не является Premium. Spotify Web API требует Premium для управления воспроизведением!\n";
      }
      
      log += "2. Проверка токена...\n";
      log += `   > Длина токена: ${spotifyToken ? spotifyToken.length : 0} символов\n`;
      
      log += "3. Получение списка активных устройств (GET /v1/me/player/devices)...\n";
      const devRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      });
      if (!devRes.ok) throw new Error(`Ошибка GET /me/player/devices: ${devRes.status}`);
      const devData = await devRes.json();
      log += `   > Найдено устройств: ${devData.devices ? devData.devices.length : 0}\n`;
      if (devData.devices && devData.devices.length > 0) {
        devData.devices.forEach((dev, index) => {
          log += `     [${index + 1}] Имя: "${dev.name}"\n`;
          log += `         ID: ${dev.id}\n`;
          log += `         Тип: ${dev.type}\n`;
          log += `         Активно: ${dev.is_active}\n`;
          log += `         Громкость: ${dev.volume_percent}%\n`;
          log += `         Ограничено (is_restricted): ${dev.is_restricted}\n`;
        });
      } else {
        log += "   ⚠️ ВНИМАНИЕ: Список устройств пуст! Spotify Connect не видит ни одного активного устройства. Убедитесь, что официальный клиент Spotify запущен на ПК/телефоне.\n";
      }
      
      log += "4. Локальный статус SDK-плеера...\n";
      log += `   > Локальный device_id: ${deviceId ? deviceId : "НЕ ЗАРЕГИСТРИРОВАН"}\n`;
      log += `   > SDK загружен: ${sdkLoaded ? "Да" : "Нет"}\n`;
      log += `   > Плеер активен: ${isPlayerActive ? "Да" : "Нет"}\n`;
      
      setDiagnosticsLog(log);
    } catch (err) {
      log += `\n❌ ОШИБКА ДИАГНОСТИКИ: ${err.message}\n`;
      setDiagnosticsLog(log);
    }
  };

  const runTestPlayback = async () => {
    let log = diagnosticsLog ? diagnosticsLog + "\n\n" : "";
    log += "=== ТЕСТОВЫЙ ЗАПУСК ТРЕКА ===\n";
    setDiagnosticsLog(log);
    
    const targetId = selectedDeviceId || deviceId;
    if (!targetId) {
      log += "❌ Ошибка: Устройство воспроизведения не выбрано и локальный плеер не готов.\n";
      setDiagnosticsLog(log);
      return;
    }
    
    try {
      log += `Выбранное устройство: ${targetId === deviceId ? "Встроенный плеер" : "Внешнее устройство (" + targetId + ")"}\n`;
      
      // Force active playback transfer before testing to avoid 404 Device Not Found race conditions
      log += `Перенос активного вещания на ${targetId} (PUT /v1/me/player)...\n`;
      setDiagnosticsLog(log);
      
      const transferRes = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [targetId], play: false })
      });
      
      log += `Ответ переноса: ${transferRes.status} (${transferRes.statusText})\n`;
      setDiagnosticsLog(log);
      
      // Wait 1200ms
      log += "Ожидание 1.2с для синхронизации серверов...\n";
      setDiagnosticsLog(log);
      await new Promise(resolve => setTimeout(resolve, 1200));

      const url = `https://api.spotify.com/v1/me/player/play?device_id=${targetId}`;
      log += `Отправка PUT-запроса на ${url}...\n`;
      setDiagnosticsLog(log);
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: ["spotify:track:4iV5W9uof0tUzsSHRfJrb4"]
        })
      });
      
      log += `Код ответа: ${res.status} (${res.statusText})\n`;
      if (res.ok) {
        log += "✅ УСПЕХ: Трек успешно отправлен на воспроизведение!\n";
      } else {
        const errBody = await res.text();
        log += `❌ ОШИБКА ОТ SPOTIFY API:\n${errBody}\n`;
      }
      setDiagnosticsLog(log);
    } catch (err) {
      log += `❌ ИСКЛЮЧЕНИЕ: ${err.message}\n`;
      setDiagnosticsLog(log);
    }
  };

  useEffect(() => {
    if (activeSessionType && selectedDeviceId && spotifyToken && !disableAutoPlay) {
      handlePlayAtmosphere(activeSessionType);
    }
  }, [activeSessionType, selectedDeviceId, spotifyToken, disableAutoPlay]);

  const handleTogglePlayback = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handleNextTrack = () => {
    if (player) player.nextTrack();
  };

  const handleDisconnectSpotify = () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_token_created_at');
    setSpotifyToken('');
    setDeviceId(null);
    setIsPlayerActive(false);
    setIsPlaying(false);
    setCurrentTrack(null);
    setSpotifyPlaying(false);
    if (player) {
      player.disconnect();
      setPlayer(null);
    }
  };

  return (
    <div className="rpg-panel" style={{ marginTop: '1rem', border: '1px solid var(--color-iron-light)', padding: '1rem' }}>
      <h3 className="gothic-title" style={{ fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1db954' }}>
        <Music size={16} />
        <span>Интеграция Spotify</span>
      </h3>

      {!spotifyToken ? (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-bone-dim)', marginBottom: '1rem' }}>
            Подключите свой аккаунт <b>Spotify Premium</b>, чтобы вплести звуковые волны в игровые режимы фокуса. 
            Мы используем безопасную авторизацию PKCE без утечки ваших ключей.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input 
              type="password" 
              className="rpg-input" 
              style={{ flex: 1, minWidth: '200px', fontSize: '0.85rem' }} 
              placeholder="Ваш Client ID из Spotify Dev Console..."
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
            <button className="rpg-btn" style={{ borderColor: '#1db954' }} onClick={handleConnectSpotify}>
              СВЯЗАТЬ SPOTIFY
            </button>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem', border: '1px dashed var(--color-blood)', fontSize: '0.8rem', color: 'var(--color-bone-dim)' }}>
            ⚠️ <b>Новые правила безопасности Spotify (с 2025 года):</b>
            <div style={{ marginTop: '0.4rem', color: '#ff4d4d' }}>
              Использование имени <b>localhost</b> запрещено! Вы должны открывать приложение по IP и регистрировать IP-адрес.
            </div>
            <div style={{ marginTop: '0.6rem' }}>
              1. Откройте приложение в браузере по этому адресу:<br />
              <a href="http://127.0.0.1:5173" target="_blank" rel="noopener noreferrer" style={{ color: '#1db954', textDecoration: 'underline', fontWeight: 'bold' }}>http://127.0.0.1:5173</a>
            </div>
            <div style={{ marginTop: '0.6rem' }}>
              2. Скопируйте и добавьте этот точный адрес в поле <b>Redirect URIs</b> в Spotify Developer Dashboard:<br />
              <code style={{ background: '#000', padding: '3px 8px', color: '#1db954', fontSize: '0.85rem', fontFamily: 'monospace', border: '1px solid var(--color-iron-light)', display: 'inline-block', marginTop: '3px' }}>
                http://127.0.0.1:5173
              </code>
            </div>
          </div>
        </div>
      ) : (
          <div>
          {/* Dynamic Non-Blocking ADHD Error HUD */}
          {spotifyError && (
            <div style={{ 
              color: 'var(--color-blood-glow)', 
              fontSize: '0.85rem', 
              marginBottom: '10px', 
              padding: '6px 12px', 
              background: 'rgba(139, 26, 26, 0.15)', 
              borderLeft: '3px solid var(--color-blood)', 
              fontFamily: 'var(--font-rpg)' 
            }}>
              ⚠️ {spotifyError}
            </div>
          )}
          
          {/* Active track state */}
          <div className="spotify-vessel-bar">
            <div className="spotify-track-status">
              <Radio className={isPlaying ? "heartbeat-pulse" : ""} size={16} style={{ color: '#1db954' }} />
              <div>
                {currentTrack ? (
                  <>
                    <b style={{ color: '#fff' }}>{currentTrack.name}</b>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', marginLeft: '8px' }}>
                      {currentTrack.artists.map(a => a.name).join(', ')}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--color-bone-dim)', fontSize: '0.85rem' }}>
                    Устройство «Focus Vessel» готово к вещанию.
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="rpg-btn" style={{ padding: '4px 10px' }} onClick={handleTogglePlayback} title="Воспроизведение / Пауза">
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="rpg-btn" style={{ padding: '4px 10px' }} onClick={handleNextTrack} title="Следующий трек">
                <SkipForward size={14} />
              </button>
              <button 
                className="rpg-btn" 
                style={{ padding: '4px 10px', borderColor: '#1db954', color: '#1db954' }} 
                onClick={runDiagnostics}
                title="Диагностика подключения"
              >
                <Activity size={14} />
              </button>
              <button 
                className="rpg-btn" 
                style={{ padding: '4px 10px', borderColor: 'var(--color-blood-glow)', color: 'var(--color-blood-glow)' }} 
                onClick={handleDisconnectSpotify}
                title="Отключить Spotify и сбросить сессию"
              >
                <Power size={14} />
              </button>
            </div>
          </div>

          {/* Target Device Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.8rem 0', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', border: '1px solid var(--color-iron-light)', borderRadius: '3px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Вывод звука (Spotify Connect):
            </span>
            <select 
              value={selectedDeviceId} 
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="rpg-input"
              style={{ flex: 1, padding: '2px 6px', fontSize: '0.75rem', height: '24px', borderColor: '#1db954', color: '#fff', background: '#000' }}
            >
              {devices.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.is_active ? '🟢 (Активно)' : ''} {d.id === deviceId ? '💻 (Встроенный)' : ''}
                </option>
              ))}
              {devices.length === 0 && deviceId && (
                <option value={deviceId}>
                  Abaddon's Focus Vessel 💻 (Встроенный)
                </option>
              )}
            </select>
            <button 
              className="rpg-btn" 
              style={{ padding: '2px 8px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={fetchDevices} 
              title="Обновить список устройств"
            >
              <RefreshCw size={11} />
            </button>
          </div>
 
          {/* Preset Soundscape Selectors */}
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--color-bone-dim)', fontFamily: 'var(--font-rpg)', marginBottom: '5px', textTransform: 'uppercase' }}>
              Переключатели атмосферных плейлистов:
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('escape')}>
                ⛓ Повозка смерти (Atrium Carceri & Swans)
              </button>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('hunt')}>
                🏹 Спокойные дела (Marcel Gidote's Holy Crab)
              </button>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('siege')}>
                💥 Осада Босса (Scary Swans / Atrium Carceri)
              </button>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('deconstruct')}>
                🔮 Разбор у алтаря (Cozy Psych-Rock)
              </button>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('recovery')}>
                🕯 Восстановление (Cozy Focus / Chill)
              </button>
              <button className="rpg-btn" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => handlePlayAtmosphere('quiet_focus')}>
                🌫 Полная тишина (Drones)
              </button>
            </div>
          </div>

          {/* Real-time Diagnostics Console */}
          {showDiagnostics && (
            <div style={{ 
              marginTop: '1rem', 
              background: '#000', 
              border: '1px solid var(--color-iron-light)', 
              padding: '0.8rem', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              color: '#1db954',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid #1db954', paddingBottom: '0.3rem' }}>
                <span style={{ fontWeight: 'bold' }}>📡 КОНСОЛЬ ОТЛАДКИ SPOTIFY</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={runTestPlayback} 
                    style={{ background: 'transparent', border: '1px solid #1db954', color: '#1db954', fontSize: '0.65rem', padding: '1px 5px', cursor: 'pointer' }}
                  >
                    ТЕСТ ТРЕКА
                  </button>
                  <button 
                    onClick={() => setShowDiagnostics(false)} 
                    style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', fontSize: '0.65rem', padding: '1px 5px', cursor: 'pointer' }}
                  >
                    ЗАКРЫТЬ
                  </button>
                </div>
              </div>
              <div style={{ lineHeight: '1.4' }}>{diagnosticsLog}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
