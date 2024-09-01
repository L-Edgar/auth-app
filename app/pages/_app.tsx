import "../styles/globals.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { AppProps } from "next/app";
import { Typography } from "@mui/material";
import Head from "next/head";

export let theme = createTheme({
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>Kanlyte Account</title>
      </Head>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
