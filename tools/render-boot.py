"""Original WARD00 cinematic. Procedural geometry only; no downloaded imagery.
Requires Python 3, Pillow, NumPy and FFmpeg. See dist/assets/boot/README.md.
"""
from pathlib import Path
import math, random, shutil, subprocess, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/assets/boot'
WORK = ROOT / 'work/boot-render'
W, H, FPS, SECONDS = 1280, 720, 30, 8
S = 1.5
SW, SH = int(W*S), int(H*S)
random.seed(241)
buildings = []
for y in np.arange(-9.4, 10.0, 1.5):
    for x in np.arange(-13.5, 13.5, 1.5):
        if abs(x - (-2 + 1.4*math.sin(y*.32))) < 1.9: continue
        if random.random() < .12: continue
        ward = 3.2 < x < 8.1 and -4.3 < y < 1.0
        h = random.uniform(.3, 1.3) if ward else random.uniform(.45, 2.9)
        if y > 3 and x < -5: h *= 1.4
        buildings.append((float(x),float(y),random.uniform(.65,1.03),random.uniform(.62,.96),h,ward))
particles = [(random.random()*W,random.random()*H,random.uniform(.2,1),random.random()*9) for _ in range(115)]
yy,xx=np.mgrid[0:SH,0:SW]
halo=np.exp(-(((xx/S-670)/570)**2+((yy/S-310)/300)**2)*1.8)
base=np.zeros((SH,SW,3),dtype=np.uint8)
for c,(low,high) in enumerate([(3,7),(8,27),(17,36)]): base[:,:,c]=low+halo*high
BASE=Image.fromarray(base)

def ease(v):
    v=max(0,min(1,v));return v*v*(3-2*v)

def render(t):
    im=BASE.copy(); d=ImageDraw.Draw(im,'RGBA')
    lights=Image.new('RGB',(SW,SH)); g=ImageDraw.Draw(lights)
    yaw=.44 + .025*math.sin(t*.25)
    zoom=28.0 + 2.0*ease(t/8)
    cy=337 + 10*ease(t/8)
    def p(x,y,z=0):
        return ((640+(x*math.cos(yaw)-y*math.sin(yaw))*zoom)*S,
                (cy+(x*math.sin(yaw)+y*math.cos(yaw))*.51*zoom-z*zoom*.92)*S)
    def line(points,color,width=1,glow=False):
        pts=[p(*v) for v in points]
        d.line(pts,fill=color,width=max(1,int(width*S)),joint='curve')
        if glow:g.line(pts,fill=tuple(color[:3]),width=max(1,int(width*S)),joint='curve')
    wake=ease(t/1.3)
    # Transparent glass map slab, beveled rim and fine district grid.
    plane=[(-15,-11,0),(15,-11,0),(15,11,0),(-15,11,0)]
    d.polygon([p(*v) for v in plane],fill=(5,21,30,round(150*wake)))
    for z,c in [(-.35,(12,50,58,180)),(0,(37,115,125,160))]:
        line([(x,y,z) for x,y,_ in plane]+[(-15,-11,z)],tuple(round(a*wake) for a in c),1.2,True)
    for x in np.arange(-15,15.1,1.5):line([(x,-11,0),(x,11,0)],(26,77,87,int(80*wake)),.7)
    for y in np.arange(-10.5,11,1.5):line([(-15,y,0),(15,y,0)],(26,77,87,int(80*wake)),.7)
    # River geometry with luminous moving contour traces.
    river=[]
    for y in np.linspace(-11,11,85):river.append((-2+1.4*math.sin(y*.32)-1.18,y,.01))
    for y in np.linspace(11,-11,85):river.append((-2+1.4*math.sin(y*.32)+1.18,y,.01))
    d.polygon([p(*v) for v in river],fill=(7,52,67,int(210*wake)))
    for off in [-1.18,-.65,0,.65,1.18]:
        trace=[(-2+1.4*math.sin(y*.32)+off+.04*math.sin(y*2-t),y,.02) for y in np.linspace(-11,11,90)]
        line(trace,(28,123,147,int((145 if abs(off)>1 else 48)*wake)),.8,abs(off)>1)
    # Bridges, city roads and small traffic pips.
    for y in [-6,1.5,7.5]:
        xc=-2+1.4*math.sin(y*.32)
        for dy in [-.12,.12]:line([(xc-1.7,y+dy,.12),(xc+1.7,y+dy,.12)],(53,160,167,int(145*wake)),1,True)
    scan = max(0,(t-.55))*5.4
    # Buildings are actual projected box geometry, sorted back to front.
    for x,y,bw,bd,bh,ward in sorted(buildings,key=lambda b:b[0]*math.sin(yaw)+b[1]*math.cos(yaw)):
        radius=math.hypot(x,y)
        reveal=ease((t-1.0-radius*.045)/.85)
        if ward:reveal=ease((t-4.45)/1.15)
        if reveal<=0:continue
        h=bh*reveal
        a=(x,y,0);b=(x+bw,y,0);c=(x+bw,y+bd,0);e=(x,y+bd,0)
        aa=(x,y,h);bb=(x+bw,y,h);cc=(x+bw,y+bd,h);ee=(x,y+bd,h)
        near=math.exp(-((radius-scan)/1.9)**2)
        if ward:
            edge=(241,170,73,int(190*reveal)); faces=[(53,41,27,240),(81,53,30,235),(117,80,40,235)]
        else:
            edge=(int(40+near*55),int(120+near*90),int(128+near*87),int(135*reveal))
            faces=[(10,32,41,245),(13,43,52,245),(22,64,71,240)]
        for face,col in zip([(b,c,cc,bb),(a,b,bb,aa),(aa,bb,cc,ee)],faces):d.polygon([p(*v) for v in face],fill=col)
        for pair in [(a,aa),(b,bb),(c,cc),(aa,bb),(bb,cc),(cc,ee),(ee,aa)]:line(pair,edge,.8,near>.4 or ward)
        if h>1.4 and not ward:
            for z in np.arange(.45,h,.55):line([(x+.12,y-.005,z),(x+bw-.12,y-.005,z)],(57,148,150,int(110*reveal)),.65)
        if ward:
            v=p(x+bw*.5,y+bd*.5,h+.06);r=1.8*S
            g.ellipse((v[0]-r,v[1]-r,v[0]+r,v[1]+r),fill=(247,186,82))
    # Expanding lidar pulse follows the streets, with a very quiet second echo.
    for rad,opacity in [(scan,1),(scan-2.1,.32)]:
        if 0<rad<21:
            fade=ease((21-rad)/5)*ease(t/.8)*opacity
            circle=[(math.cos(a)*rad,math.sin(a)*rad,.06) for a in np.linspace(0,math.tau,200)]
            line(circle,(45,196,192,int(170*fade)),1.5,True)
    # The missing ward emerges in warm amber: two interrupted corner outlines.
    found=ease((t-4.3)/1.3)
    if found:
        for x,y,dx,dy in [(2.9,-4.7,1,1),(8.9,-4.7,-1,1),(8.9,1.8,-1,-1),(2.9,1.8,1,-1)]:
            line([(x+dx*1.05,y,.11),(x,y,.11),(x,y+dy*1.05,.11)],(249,176,71,int(255*found)),1.8,True)
        center=(5.85,-1.45)
        for j in range(2):
            r=1.2+((t-4.5+j*.7)%1.8)*1.6
            alpha=(1-(r-1.2)/2.88)*found
            circle=[(center[0]+math.cos(a)*r,center[1]+math.sin(a)*r,.05) for a in np.linspace(0,math.tau,100)]
            line(circle,(200,132,54,int(95*alpha)),.9,True)
        for ex,ey in [(-9,-5),(9,7)]:
            amt=ease((t-5.25)/1.25)
            arc=[]
            for f in np.linspace(0,amt,70):arc.append((center[0]+(ex-center[0])*f,center[1]+(ey-center[1])*f,math.sin(f*math.pi)*3.1+.2))
            if len(arc)>1:line(arc,(82,176,170,int(125*found)),.8,True)
    # Cartographic edge accents, no generated text (titles belong to the DOM).
    for n in range(31):
        x=-15+n
        line([(x,-11.25,0),(x,-11.25-(.26 if n%5==0 else .12),0)],(46,113,124,int(120*wake)),.8)
    # Depth particles and light diagonal rainfall. Keep the title area quiet.
    for px,py,depth,phase in particles:
        ry=(py+t*(18+depth*30))%H
        rx=px-(t*7)%30
        if ry>560: continue
        alpha=int((10+depth*20)*wake)
        d.line([(rx*S,ry*S),((rx-3*depth)*S,(ry+8*depth)*S)],fill=(118,182,196,alpha),width=1)
    # True additive bloom, restrained to preserve map detail.
    soft=lights.filter(ImageFilter.GaussianBlur(9*S))
    sharp=lights.filter(ImageFilter.GaussianBlur(2.0*S))
    arr=np.asarray(im,dtype=np.float32)+np.asarray(soft,dtype=np.float32)*.52+np.asarray(sharp,dtype=np.float32)*.25
    # Top/bottom falloff allows crisp HTML captions over the video.
    edge=np.minimum(1,np.minimum(yy/(100*S),(SH-yy)/(145*S)))
    vignette=np.clip(1-(((xx/S-640)/950)**2+((yy/S-330)/620)**2)*.42,.35,1)
    fade=.08+.92*ease(t/.7)
    arr*=((.3+.7*edge)*vignette*fade)[:,:,None]
    return Image.fromarray(np.clip(arr,0,255).astype('uint8')).resize((W,H),Image.Resampling.LANCZOS)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--ffmpeg',default=shutil.which('ffmpeg'));parser.add_argument('--stills-only',action='store_true');args=parser.parse_args()
    OUT.mkdir(parents=True,exist_ok=True);WORK.mkdir(parents=True,exist_ok=True)
    for t in [1.6,4.0,6.8]:render(t).save(WORK/f'frame-{t:.1f}.jpg',quality=94)
    render(7.7).save(OUT/'poster.webp',quality=89,method=6)
    if args.stills_only:return
    if not args.ffmpeg:raise SystemExit('FFmpeg not found. Supply --ffmpeg /path/to/ffmpeg')
    cmd=[args.ffmpeg,'-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','slow','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'ward00-boot.mp4')]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.DEVNULL)
    try:
        for i in range(FPS*SECONDS):
            proc.stdin.write(render(i/FPS).tobytes())
            if i%30==0:print(f'Rendered {i//30}/{SECONDS} seconds',flush=True)
    finally:proc.stdin.close()
    if proc.wait()!=0:raise SystemExit('FFmpeg encode failed')
    print(f'Complete: {(OUT/"ward00-boot.mp4").stat().st_size:,} bytes',flush=True)

if __name__=='__main__':main()
