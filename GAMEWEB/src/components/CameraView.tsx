import type { GameState } from "../game/types";
import { cameras } from "../data/world";
import { cameraState } from "../game/CameraSystem";
import { clock } from "../game/GameClock";
export default function CameraView({
  game,
  camera,
  compact = false,
}: {
  game: GameState;
  camera: number;
  compact?: boolean;
}) {
  const state = cameraState(game, camera);
  const outdoor = [0, 2, 3, 6].includes(camera);
  return (
    <div
      className={`camera-feed ${compact ? "compact" : ""} ${state === "INTERFERÊNCIA" ? "interference" : ""}`}
    >
      <div className="camera-osd">
        <span>
          CAM {String(camera + 1).padStart(2, "0")} / {cameras[camera]}
        </span>
        <span className={state === "NORMAL" ? "" : "amber"}>
          ● {state === "NORMAL" ? "AO VIVO" : state}
        </span>
      </div>
      {state === "SEM SINAL" ? (
        <div className="no-signal">
          ×<span>SEM SINAL</span>
          <small>Verifique a alimentação em SISTEMA</small>
        </div>
      ) : (
        <svg
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid slice"
          aria-label={`Cena de vigilância: ${cameras[camera]}`}
          role="img"
        >
          <defs>
            <linearGradient id={`shade${camera}`} x2="0" y2="1">
              <stop stopColor="#273329" />
              <stop offset="1" stopColor="#080d0a" />
            </linearGradient>
            <radialGradient id={`lamp${camera}`}>
              <stop stopColor="#b5c79b" stopOpacity=".17" />
              <stop offset="1" stopColor="#b5c79b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="800" height="450" fill={`url(#shade${camera})`} />
          {outdoor ? (
            <>
              <path
                d="M0 213 35 164 80 206 115 130 144 191 180 165 217 230 260 175 311 204 355 135 410 200 445 160 500 204 566 157 630 207 700 127 760 214 800 180V330H0Z"
                fill="#111b14"
              />
              <path d="M320 220 600 220 820 450 85 450Z" fill="#303a30" />
              <path
                d="m462 226 27 224"
                stroke="#90927b"
                strokeWidth="3"
                strokeDasharray="24 22"
                opacity=".4"
              />
              {camera !== 3 && (
                <g>
                  <path d="M20 144H270V314H20Z" fill="#283126" />
                  <path d="M12 144 110 111 278 139v12H12" fill="#3d4637" />
                  <path d="M58 201h60v63H58zm95 0h60v63h-60" fill="#0a120d" />
                  <path d="M29 294h220" stroke="#59614b" />
                </g>
              )}
              <path
                d="M605 301V88h-62"
                fill="none"
                stroke="#57604a"
                strokeWidth="5"
              />
              <ellipse
                cx="550"
                cy="280"
                rx="185"
                ry="164"
                fill={`url(#lamp${camera})`}
              />
              <path d="M532 88h30" stroke="#a8b792" strokeWidth="5" />
              {camera === 2 && (
                <g stroke="#66705b" fill="#1a211b">
                  <path
                    d="M367 310v-40h36v40m-41 0h47m-41 0-5 30m40-30 6 30"
                    strokeWidth="4"
                  />
                  <path d="M54 359h125l20 32H39Z" />
                </g>
              )}
              {camera === 6 && (
                <g stroke="#727663" opacity=".5">
                  <path d="M70 400h650M110 350h580M150 302h510" />
                  <path d="m235 240-75 210m170-210 75 210" />
                </g>
              )}
            </>
          ) : (
            <>
              <path d="m0 0 290 125v190L0 450Z" fill="#293127" />
              <path d="m800 0-290 125v190l290 135Z" fill="#20291f" />
              <path d="M290 125h220v190H290Z" fill="#384032" />
              <path d="M360 180h85v135h-85Z" fill="#080e0b" />
              <g fill="none" stroke="#556048" opacity=".55">
                <path d="m0 450 290-135m510 135L510 315M0 370h800M150 0l175 125m325-125L475 125" />
                <path d="m63 99 125 42v182L63 367Z" />
                <path d="m710 120-104 38v159l104 40Z" />
              </g>
              <path d="M344 56h110l-22 14h-68Z" fill="#b5bea0" opacity=".55" />
              <ellipse
                cx="400"
                cy="250"
                rx="220"
                ry="160"
                fill={`url(#lamp${camera})`}
              />
              {camera === 7 && (
                <g>
                  <path
                    d="M490 328h237v24H490Zm20 24v80m190-80v80"
                    stroke="#55604b"
                    fill="#283422"
                    strokeWidth="6"
                  />
                  <path
                    d="M560 260h100v67H560Z"
                    fill="#090d09"
                    stroke="#74845e"
                  />
                  <path d="M570 270h80v43h-80Z" fill="#42613d" />
                </g>
              )}
            </>
          )}
          {state === "MOVIMENTO DETECTADO" && (
            <g fill="#060a07">
              <ellipse
                cx={camera === 2 ? 384 : 402}
                cy={camera === 2 ? 233 : 235}
                rx="13"
                ry="17"
              />
              <path
                d={
                  camera === 2
                    ? "M371 247q15-8 27 0l10 52h-47Z"
                    : "M389 250q13-7 26 0l9 67h-44Z"
                }
              />
            </g>
          )}
          <rect width="800" height="450" fill="#8fa276" opacity=".04" />
        </svg>
      )}
      <div className="camera-scan" />
      <div className="camera-bottom">
        <span>
          REC <i /> · H.264 / 12 FPS
        </span>
        <span>
          {game.night >= 3 && camera === 1
            ? "06:13:00"
            : `${clock(game.minute)}:00`}
        </span>
      </div>
    </div>
  );
}
