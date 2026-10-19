// Which build this is. The App Store / TestFlight app and the website ship TESTER = false. native/copy-web.mjs rewrites
// this file in native/www when SC_TESTER=1 (native/build-tester.sh), for the separate "SC Tester" app on Sevaan's phone:
// Testing tools always on in Settings, no ⏱ in the Explore header (2026-10-19, Sevaan).
export const TESTER = false;
