# Admin: brauzerda fon olib tashlash

Faqat admin panel (`/admin/products/*`) rasm yuklashda ishlatadi; ommaviy sayt yuklamaydi.

| Fayl | Manba | Litsenziya |
|---|---|---|
| `ort.wasm.min.js`, `ort-wasm-simd-threaded.mjs`, `ort-wasm-simd-threaded.wasm` | onnxruntime-web 1.20.1 (npm, `dist/`) | MIT (`LICENSE-onnxruntime-web.txt`) |
| `u2netp.onnx` | U²-Net (small), github.com/xuebinqin/U-2-Net — rembg release v0.0.0 | Apache-2.0 |

Yangilash: `npm pack onnxruntime-web@<v>` → shu 3 faylni nusxalang; `ort.env.wasm.wasmPaths = '/admin-ai/'`
(`src/app/admin/products/[id]/removeBackground.ts`).
