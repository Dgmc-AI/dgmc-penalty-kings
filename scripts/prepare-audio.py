"""Reproduce the game's CC0 stadium edits from public Freesound HQ recordings.
No accounts, purchases or API keys. Source URLs and licensing: ASSET_CREDITS.md.
Requires Python 3 and ffmpeg. Originals are kept outside the repository.
"""
import subprocess,urllib.request,pathlib,tempfile
root=pathlib.Path(__file__).resolve().parents[1];dest=root/'public/audio';dest.mkdir(exist_ok=True)
source=pathlib.Path('/tmp/dgmc-audio-source');source.mkdir(exist_ok=True)
clips=[('ambience',829454,24,60),('goal-1',829455,.55,9),('goal-2',829455,15,8),('save-1',829453,.35,4.8),('save-2',829453,7,5),('miss-1',829452,.35,7),('miss-2',829452,13.7,7)]
for name,id,start,duration in clips:
 p=source/f'{id}.mp3'
 if not p.exists():urllib.request.urlretrieve(f'https://cdn.freesound.org/previews/829/{id}_3625328-hq.mp3',p)
 fade=.8 if name=='ambience' else .04
 subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',str(p),'-t',str(duration),'-af',f'loudnorm=I=-18:TP=-2:LRA=11,afade=t=in:st=0:d={fade},afade=t=out:st={duration-1.2}:d=1.2','-ar','44100','-ac','2','-c:a','libmp3lame','-b:a','128k',str(dest/f'{name}.mp3')],check=True)
 print(name,duration)
