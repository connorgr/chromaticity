import resolve from 'rollup-plugin-node-resolve';

export default {
  input: "src/js/main.js",
  output: {
    file: "chromaticity.js",
    format: "umd"
  },
  plugins: [
    resolve()
  ]
}
