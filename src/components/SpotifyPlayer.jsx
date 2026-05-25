import React, { useState, useEffect } from 'react';
import { Music, RefreshCw, Key, Power, Play, Pause, SkipForward, Radio } from 'lucide-react';
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

  // Sync isPlaying to synth drone muting
  useEffect(() => {
    setSpotifyPlaying(isPlaying);
  }, [isPlaying, setSpotifyPlaying]);

  // Focus playlists custom state (user can paste their own Spotify URI links!)
  const [playlists, setPlaylists] = useState({
    escape: 'spotify:playlist:4lGv8NnJpX8v7CqL8JpDgu', // Atrium Carceri & Swans Dark Ambient Mix
    hunt: 'spotify:playlist:37i9dQZF1E8O7qZfQ4x14d', // Marcel Gidote's Holy Crab Radio & Cozy Psych-Jazz
    siege: 'spotify:playlist:0P6hI9y2dshZ3zP52G0i1G', // Swans & Atrium Carceri Heavy Intense Focus
    deconstruct: 'spotify:playlist:37i9dQZF1DX8TZZiO5Fr7i', // Cozy Psychedelic Rock / Radio
    recovery: 'spotify:playlist:37i9dQZF1DX8NTLI297vKT', // Soft Medieval Lutes & Cozy Chill
    quiet_focus: 'spotify:playlist:37i9dQZF1DWZFIeFvl6H5v' // Quiet focus, low drones
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
    const scope = 'user-modify-playback-state user-read-playback-state streaming user-read-currently-playing';

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

    if (code && verifier && savedClientId) {
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
          setSpotifyToken(data.access_token);
          // clean URL parameters
          window.history.replaceState({}, document.title, window.location.origin);
        } catch (e) {
          console.error("Spotify OAuth Token Exchange Error:", e);
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
      setIsPlayerActive(true);
      
      // Auto-transfer playback to this browser device
      fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [device_id], play: false })
      }).catch(e => console.warn("Could not transfer playback device automatically:", e));
    });

    newPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
    });

    newPlayer.connect();
    setPlayer(newPlayer);

    return () => {
      newPlayer.removeListener('ready');
      newPlayer.removeListener('player_state_changed');
      newPlayer.disconnect();
      setPlayer(null);
    };
  }, [sdkLoaded, spotifyToken]);

  const [spotifyError, setSpotifyError] = useState('');

  // --- SYNC AUDIO PLAYBACK WITH STATE COGNITION ---
  const handlePlayAtmosphere = async (mood) => {
    if (!spotifyToken || !deviceId) {
      setSpotifyError("Устройство Focus Vessel еще регистрируется. Подождите пару секунд...");
      setTimeout(() => setSpotifyError(''), 6000);
      return;
    }

    const playlistUri = playlists[mood] || playlists.quiet_focus;

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: playlistUri
        })
      });

      if (!response.ok) {
        let errMessage = `HTTP error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error && errData.error.message) {
            errMessage = errData.error.message;
          }
        } catch (_) {}
        
        const error = new Error(errMessage);
        error.status = response.status;
        throw error;
      }
      setIsPlaying(true);
      setSpotifyError('');
    } catch (e) {
      console.error(e);
      let userFriendlyError = "Не удалось запустить трек. Запустите Spotify Premium на ПК/телефоне и попробуйте снова!";
      
      const status = e.status;
      const msg = e.message ? e.message.toLowerCase() : "";
      
      if (status === 401 || msg.includes("token expired") || msg.includes("401")) {
        userFriendlyError = "Срок действия токена Spotify истек. Пожалуйста, переподключите аккаунт!";
        setSpotifyToken(''); // Clear the expired token so user can connect again
      } else if (status === 403 || msg.includes("premium") || msg.includes("403")) {
        userFriendlyError = "Для работы плеера требуется подписка Spotify Premium. Проверьте ваш аккаунт!";
      } else if (status === 404 || msg.includes("device") || msg.includes("404")) {
        userFriendlyError = "Устройство Focus Vessel не найдено или не готово. Убедитесь, что Spotify Premium запущен на ПК или телефоне!";
      } else if (e.message) {
        userFriendlyError = `Ошибка Spotify: ${e.message}. Откройте плеер на ПК/телефоне и попробуйте снова.`;
      }
      
      setSpotifyError(userFriendlyError);
      setTimeout(() => setSpotifyError(''), 10000);
    }
  };

  useEffect(() => {
    if (activeSessionType && deviceId && spotifyToken) {
      handlePlayAtmosphere(activeSessionType);
    }
  }, [activeSessionType, deviceId, spotifyToken]);

  const handleTogglePlayback = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handleNextTrack = () => {
    if (player) player.nextTrack();
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="rpg-btn" style={{ padding: '4px 10px' }} onClick={handleTogglePlayback}>
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="rpg-btn" style={{ padding: '4px 10px' }} onClick={handleNextTrack}>
                <SkipForward size={14} />
              </button>
            </div>
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
        </div>
      )}
    </div>
  );
}
