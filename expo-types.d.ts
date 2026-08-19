/// <reference types="expo/types" />

// Referensi eksplisit ke augmentasi tipe web expo (mis. `hovered` pada
// PressableStateCallbackType). `expo-env.d.ts` (yang berisi referensi yang
// sama) adalah file generated dan di-.gitignore, jadi CI yang mengecek
// typecheck tanpa menjalankan `expo start` tidak akan mendapatkannya. File
// ini sengaja ditrack supaya `pnpm typecheck` lulus di lingkungan bersih.