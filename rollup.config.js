import resolve from 'rollup-plugin-node-resolve';

export default {
  input: "src/js/main.js",
  globals: { d3: "d3" },
  output: {
    file: "chromaticity.js",
    format: "umd"
  },
  plugins: [
    resolve()
  ]
}
