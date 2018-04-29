@echo off

copy node_modules\webextension-polyfill\dist\browser-polyfill.min.js src\browser-polyfill.min.js

tsc --p tsconfig.json

copy src\manifest.json dist\manifest.json

echo Done.
