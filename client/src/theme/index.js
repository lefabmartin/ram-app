import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: '"Rambla", sans-serif' },
        body: { value: '"Rambla", sans-serif' },
      },
      colors: {
        brand: {
          primary: { value: "#279989" },
          secondary: { value: "#f7b512" },
          grey: { value: "#efefef" },
          darkGrey: { value: "#423f3f" },
          lightGrey: { value: "#d3d3d3" },
          success: { value: "#5cb85c" },
          error: { value: "#b40101" },
        },
      },
    },
  },
  globalCss: {
    body: {
      bg: "#efefef",
      color: "#3f3f3f",
    },
  },
});

const system = createSystem(defaultConfig, customConfig);

export default system;
