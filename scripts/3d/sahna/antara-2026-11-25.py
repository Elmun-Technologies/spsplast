import cv2, numpy as np, json, random
OUT='/tmp/scn/nv/'
W,H,R=190.0,290.0,0.2          # mm, mm/px
tw,th=int(W/R),int(H/R)
# 1) yuza faktura: qolip suratining izsiz qismidan (y160-300, x230-520), ko'zgu bilan to'ldirish
ph=cv2.imread('/home/claude/spsplast/media-src/live/oltiburchak-galka-qolip.jpg',cv2.IMREAD_GRAYSCALE).astype(np.float32)/255
sx=ph.shape[1]/782.0
crop=ph[int(165*sx):int(300*sx), int(235*sx):int(515*sx)]
crop=crop-cv2.GaussianBlur(crop,(0,0),12)
f=(1/R)/(545*sx/190.0)            # surat: bo'shliq eni 545 px (782 masshtabda) = 190 mm
f*=3.6                            # eski sahnadagidek yirikroq g'adir-budur
cs_=cv2.resize(crop,(int(crop.shape[1]*f),int(crop.shape[0]*f)),interpolation=cv2.INTER_CUBIC)
# qolip fakturasining radial spektri -> takrorsiz shovqin (bir xil donadorlik, ko'zgu naqshi yo'q)
F=np.abs(np.fft.fftshift(np.fft.fft2(cs_*np.outer(np.hanning(cs_.shape[0]),np.hanning(cs_.shape[1])))))
cy,cx=np.array(F.shape)//2; yy_,xx_=np.mgrid[0:F.shape[0],0:F.shape[1]]
rr=np.hypot((yy_-cy)/F.shape[0],(xx_-cx)/F.shape[1]); bins=np.linspace(0,0.71,90); prof=np.zeros(89)
for i in range(89):
    mm=(rr>=bins[i])&(rr<bins[i+1]); prof[i]=F[mm].mean() if mm.any() else 0
ny,nx=th,tw; fy=np.fft.fftfreq(ny)[:,None]; fx=np.fft.fftfreq(nx)[None,:]; r2=np.hypot(fy,fx)
amp=np.interp(r2,(bins[:-1]+bins[1:])/2,prof); rng0=np.random.default_rng(3)
rep=np.real(np.fft.ifft2(amp*np.exp(2j*np.pi*rng0.random((ny,nx)))))
rep=(rep-rep.mean())/rep.std()
# eski sahnadagi "g'ijim" faktura: ikki oktavali qirrali shovqin (yirik yumshoq to'lqinlar + biroz mayda)
def band(sig,seed):
    z=np.random.default_rng(seed).standard_normal((th,tw)).astype(np.float32); z=cv2.GaussianBlur(z,(0,0),sig); return z/z.std()
crum=(1-np.abs(band(14,11)))*1.0+(1-np.abs(band(6,12)))*0.45+band(2.5,13)*0.10
crum=(crum-crum.mean())/crum.std()
h=crum*0.85   # ~±0.6 mm g'adir-budur
# 2) izlar: qolipdan o'lchangan, qo'shni plitkada davom etadigan qilib (s=0.45 / 0.55)
P=lambda x,y:(x*W,y*H)
C1,C2=P(.5,.35),P(.5,.605)
# Chiziq qo'shni plitkada TO'G'RI davom etishi uchun: C1 -> chet nuqtasi -> qo'shni plitkaning C2 si bir chiziqda
# (qo'shni ustun +0.8W, -0.5H da). Chet nuqtasi = shu chiziqning (0.8W,0)-(W,0.5H) qirra bilan kesishishi.
c1=np.array(C1); c2n=np.array([C2[0]+0.8*W, C2[1]-0.5*H]); e0=np.array([0.8*W,0.]); e1=np.array([W,0.5*H])
A_=np.array([c2n-c1, e0-e1]).T; t_,s_=np.linalg.solve(A_, e0-c1); E=c1+t_*(c2n-c1)
ex,ey=E[0]/W,E[1]/H; print('chet nuqtasi', round(ex,3), round(ey,3))
segs=[(C1,P(1-ex,ey)),(C1,P(ex,ey)),(C1,C2),(C2,P(1-ex,ey+.5)),(C2,P(ex,ey+.5))]
yy,xx=(np.mgrid[0:th,0:tw]+0.5)*R
dist=np.full((th,tw),1e9,np.float32)
for (ax,ay),(bx,by) in segs:
    vx,vy=bx-ax,by-ay; L2=vx*vx+vy*vy
    t=np.clip(((xx-ax)*vx+(yy-ay)*vy)/L2,0,1)
    dist=np.minimum(dist,np.hypot(xx-(ax+t*vx),yy-(ay+t*vy)))
groove=np.clip(1-dist/2.3,0,1)**0.6*3.4   # eni ~6 mm, chuqurligi ~4 mm
h=h-groove
# 3) chet faskasi (olti burchak)
poly=np.array([[.2,0],[.8,0],[1,.5],[.8,1],[.2,1],[0,.5]])*[tw-1,th-1]
m=np.zeros((th,tw),np.uint8); cv2.fillPoly(m,[poly.astype(np.int32)],1)
dd=cv2.distanceTransform(np.pad(m,1),cv2.DIST_L2,5)[1:-1,1:-1]*R
h=h*np.clip(dd/3,0,1)-np.clip(1-dd/3.0,0,1)*3.0
hb=cv2.GaussianBlur(h.astype(np.float32),(0,0),0.7)
gx=cv2.Sobel(hb,cv2.CV_32F,1,0,ksize=3)/8/R; gy=cv2.Sobel(hb,cv2.CV_32F,0,1,ksize=3)/8/R
n=np.dstack([-gx,gy,np.ones_like(hb)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
cv2.imwrite(OUT+'antara1.png',((n*0.5+0.5)*255).clip(0,255).astype(np.uint8)[...,::-1])
alb=0.93+cv2.GaussianBlur(rep.astype(np.float32),(0,0),2.0)*0.035-np.clip(1-dist/2.4,0,1)**0.8*0.42
alb=alb*np.where(dd<1.2,0.75,1.0)
cv2.imwrite(OUT+'antara1_a.png',(np.clip(alb,0,1)*255).astype(np.uint8))
prev=((hb-hb.min())/(hb.max()-hb.min())*255).astype(np.uint8); cv2.imwrite('/tmp/scn/pv/antara1_h.png',prev)
# 4) tartib: tik olti burchak, ustunlar yarim balandlikka surilgan; 4 xil tus (eski sahnadagidek)
g=0.005; Pp=[[(px-.5)*(W/1000-g),(pz-.5)*(H/1000-g)] for px,pz in [[.2,0],[.8,0],[1,.5],[.8,1],[.2,1],[0,.5]]]
cols=['#b0a89d','#a39f97','#97938d','#8e8b87']; rng=random.Random(5); tiles=[]; dx=0.8*W/1000
NI,NJ=10,7
for i in range(NI):
    for j in range(NJ): tiles.append({'t':rng.randrange(4),'x':i*dx,'z':j*H/1000+(H/2000 if i%2 else 0)})
json.dump({'types':[{'name':'H%d'%i,'poly':Pp,'h':.045,'color':c,'n':'antara1.png','map':'antara1_a.png'} for i,c in enumerate(cols)],'a':[NI*dx,0],'b':[0,NJ*H/1000],'tiles':tiles},open(OUT+'antara1.json','w'))
print('ok',tw,th)
