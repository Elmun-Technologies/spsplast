# "Natija" (terilgan plitka) sahnasi — 3D modeldan render

Bosma katalog va saytdagi "natija" rasmlari AI generatsiya edi: naqsh taxminiy chiqardi ("izlar mos emas",
"izlar ko'rinmaydi"). Bu vosita rasmni qolipning **haqiqiy 3D modelidan** oladi:
`public/3d/<id>/terilgan.glb` (plitkalar + normal xarita) → terish davri avtomatik topiladi → katta maydon →
quyosh, haqiqiy atrof-muhit (HDRI), tuvak/stol → 1700×2400 JPEG.

```bash
# brauzer: PW_CHROMIUM_PATH=<chrome>; resurslar: SAHNA_ASSETS=<papka> (standart /tmp/scn)
node scripts/3d/sahna/run.mjs glb.html out/t57.jpg "id=t57&yaw=24&props=potted_plant_01:-1.7:-4.6:1.5:30" 1700 2400
node scripts/3d/sahna/run.mjs glb.html out/nat2.jpg "nv=nat2&yaw=18" 1700 2400      # GLB yo'q novinka: $SAHNA_ASSETS/nv/<nom>.json
node scripts/3d/sahna/run.mjs kerb.html out/bord.jpg "ss=1.4&bush=0&hedge=0&hdr=rooitou_park&bgrot=200&fk=A&bk=B" 1700 2400
```

**Resurslar repoda emas** (`$SAHNA_ASSETS`), hammasi CC0 (Poly Haven) yoki protsedura:
- `hdr/<nom>_2k.hdr` + `hdr/<nom>.jpg` (8k tonemapped) — `rooitou_park`, `garden_nook`, `symmetrical_garden_02`
  (`https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/<nom>_2k.hdr`, `…/HDRIs/extra/Tonemapped%20JPG/<nom>.jpg`).
  Quyosh azimuti hammasida 36° (`sunaz`); `vaz` — qarash azimuti (fon tanlash).
- `props/<nom>/<nom>.gltf` — `potted_plant_01`, `potted_plant_02`, `planter_box_01`, `outdoor_table_chair_set_01`
  (`https://api.polyhaven.com/files/<nom>` → gltf 2k + `include`).
- `tex/conc_a.png`, `tex/lawn_a.png`, `tex/lawn_n.png` (+ bordyur uchun `A_*/B_*`, `pave_*`, `grav_*`) — protsedura teksturalari.
- `nv/<nom>.json` — GLB'siz qoliplar: `{types:[{w,d,h,color,n:<normal.png>,poly?}], a, b, tiles:[{t,x,z,r}]}` (bitta davr).

Asosiy parametrlar: `yaw` (naqsh burilishi), `c0..cN` (material ranglari, hex), `nocolor=1&mix=1` (bir xil shakl,
tasodifiy rang — Rokki), `ns` (relyef kuchi), `hdr`/`vaz` (fon), `props`, `cs` (kamera masshtabi).

Qoidalar (2026-11-25 da aniqlangan): davr har bir plitka turi bo'yicha alohida tekshiriladi (aks holda Orxideyada
teshik qolardi); GLB'dagi ko'tarib qo'yilgan plitka joyiga qaytariladi (`glb-layout.mjs` `findHole` qoidasi);
GLB'dagi qop-qora rang grafitga almashtiriladi. Natijani har doim ko'z bilan tekshiring.
