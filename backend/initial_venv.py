import subprocess
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
VENV_DIR = BASE_DIR / '.venv'
REQUIREMENTS_FILE = BASE_DIR / 'requirements.txt'

def Setup_VENV():
    """Create and activate virtual environment."""
    venv_path = VENV_DIR
    if not venv_path.exists():
        print("Creating virtual environment...")
        subprocess.run([sys.executable, '-m', 'venv', str(venv_path)])
        print("Virtual environment created at:", venv_path)
    else:
        print("Virtual environment already exists at:", venv_path)
    
    return venv_path

def Activate_VENV(venv_path):
    """Activate the virtual environment."""
    if sys.platform == 'win32':
        activate_script = venv_path / 'Scripts' / 'Activate.ps1'
    else:
        activate_script = venv_path / 'bin' / 'activate'

    should_activate = False
    if '--activate' in sys.argv:
        should_activate = True
    else:
        ans = input("Activate virtualenv now and open a shell? [y/N]: ").strip().lower()
        should_activate = ans == 'y' or ans == 'yes'

    if not should_activate:
        print("To activate the virtual environment, run:")
        if sys.platform == 'win32':
            print(f"  {activate_script}")
        else:
            print(f"  source {activate_script}")
        return

    try:
        if sys.platform == 'win32':
            cmd = [
                "powershell",
                "-NoExit",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                f"& '{str(activate_script)}'"
            ]
            print("Opening PowerShell with the virtualenv activated...")
            subprocess.run(cmd)
        else:
            shell = os.environ.get('SHELL', '/bin/bash')
            cmd = [
                shell,
                "-i",
                "-c",
                f"source '{str(activate_script)}' && exec {shell}"
            ]
            print(f"Opening {shell} with the virtualenv activated...")
            subprocess.run(cmd)
    except FileNotFoundError:
        print("Shell executable not found. Please activate manually:")
        if sys.platform == 'win32':
            print(f"  {activate_script}")
        else:
            print(f"  source {activate_script}")
    except Exception as e:
        print(f"Failed to open activated shell: {e}")


def Install_Requirements(venv_path):
    """Install `backend/requirements.txt` into the venv.

    Behavior:
    - If called with `--install` it runs non-interactively.
    - Otherwise prompts the user to confirm.
    - Uses the venv's python (`python -m pip install -r`) for reliability.
    """
    if not REQUIREMENTS_FILE.exists():
        print(f"[WARN] Requirements file not found at {REQUIREMENTS_FILE}. Skipping.")
        return

    do_install = False
    if '--install' in sys.argv:
        do_install = True
    else:
        ans = input("Install backend requirements now? [Y/n]: ").strip().lower()
        do_install = (ans == '' or ans == 'y' or ans == 'yes')

    if not do_install:
        print(f"To install later, run: {venv_path / 'Scripts' / 'python.exe' if sys.platform=='win32' else venv_path / 'bin' / 'python'} -m pip install -r {REQUIREMENTS_FILE}")
        return

    if sys.platform == 'win32':
        py_exec = venv_path / 'Scripts' / 'python.exe'
    else:
        py_exec = venv_path / 'bin' / 'python'

    if not py_exec.exists():
        print("[WARN] Python executable in venv not found; trying system python.")
        py_exec = Path(sys.executable)

    cmd = [str(py_exec), '-m', 'pip', 'install', '-r', str(REQUIREMENTS_FILE)]
    print(f"Installing requirements from {REQUIREMENTS_FILE} using {py_exec}...")
    try:
        subprocess.run(cmd, check=True)
        print("[OK] Requirements installed.")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to install requirements (exit {e.returncode}). Try running the command manually:")
        print(' '.join(cmd))

if __name__ == '__main__':
    venv = Setup_VENV()
    Install_Requirements(venv)
    Activate_VENV(venv)