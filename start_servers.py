#!/usr/bin/env python3
"""
Start backend and frontend dev servers only (no installs, no venv creation).

Usage:
  python start_servers.py        # starts backend+frontend
  python start_servers.py --no-frontend
  python start_servers.py --port 8001
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / 'backend'
FRONTEND_DIR = ROOT / 'frontend'
VENV_DIR = BACKEND_DIR / '.venv'


def venv_python() -> Path:
    if sys.platform == 'win32':
        return VENV_DIR / 'Scripts' / 'python.exe'
    return VENV_DIR / 'bin' / 'python'


def start_servers(no_frontend: bool = False, port: int = 8000):
    if not BACKEND_DIR.exists():
        print(f"[error] backend directory not found at {BACKEND_DIR}")
        sys.exit(1)

    py = venv_python()
    if not py.exists():
        print('[info] backend venv python not found; using current interpreter')
        py = Path(sys.executable)

    backend_cmd = [str(py), 'manage.py', 'runserver', f'0.0.0.0:{port}']
    print(f"[info] Starting backend: {' '.join(backend_cmd)}")
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(BACKEND_DIR))

    frontend_proc = None
    if not no_frontend and FRONTEND_DIR.exists():
        # On Windows the npm entrypoint may be a batch file (npm.cmd). Using
        # a shell command via `cmd /c` ensures the platform resolves the
        # correct executable. On POSIX systems invoke npm directly.
        # include --open if the caller requested the browser to open automatically
        open_flag = getattr(start_servers, '_open_browser', False)

        if sys.platform == 'win32':
            # prefer cmd /c to let Windows resolve npm/npm.cmd
            frontend_cmd = ['cmd', '/c', 'npm', 'run', 'dev']
            if open_flag:
                frontend_cmd += ['--', '--open']
            print(f"[info] Starting frontend (Windows shell): {' '.join(frontend_cmd)}")
            try:
                frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(FRONTEND_DIR))
            except FileNotFoundError:
                print('[warn] npm not found in PATH; skipping frontend start')
        else:
            if shutil.which('npm') is None:
                print('[warn] npm not found; skipping frontend start')
            else:
                frontend_cmd = ['npm', 'run', 'dev']
                if open_flag:
                    frontend_cmd += ['--', '--open']
                print(f"[info] Starting frontend: {' '.join(frontend_cmd)}")
                frontend_proc = subprocess.Popen(frontend_cmd, cwd=str(FRONTEND_DIR))

    print('\n[info] Servers started. Press Ctrl+C to stop.')

    try:
        while True:
            if backend_proc.poll() is not None:
                print('[warn] Backend exited')
                break
            if frontend_proc and frontend_proc.poll() is not None:
                print('[warn] Frontend exited')
                break
            time.sleep(0.5)
    except KeyboardInterrupt:
        print('\n[info] Stopping servers...')

    for p, name in ((backend_proc, 'backend'), (frontend_proc, 'frontend')):
        if p is None:
            continue
        try:
            if p.poll() is None:
                p.terminate()
                try:
                    p.wait(timeout=5)
                except Exception:
                    p.kill()
        except Exception as e:
            print(f"[error] stopping {name}: {e}")

    print('[info] Servers stopped')


if __name__ == '__main__':
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument('--no-frontend', action='store_true')
    parser.add_argument('--open', action='store_true', dest='open_browser', help='Open browser automatically when Vite starts')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()

    # pass the open flag into the function via attribute (simple and avoids changing signature)
    setattr(start_servers, '_open_browser', bool(args.open_browser))
    start_servers(no_frontend=args.no_frontend, port=args.port)
