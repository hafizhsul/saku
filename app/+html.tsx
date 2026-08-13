import type { PropsWithChildren } from "react"
import { ScrollViewStyleReset } from "expo-router/html"

/**
 * Cangkang HTML web: default Expo + favicon berpasangan tema.
 * Chrome/brauser gelap memakai varian terang agar ikon tetap kontras.
 */
export default function Root({ children }: PropsWithChildren): React.ReactElement {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-dark.png" media="(prefers-color-scheme: dark)" />
        {children}
      </head>
      <body>{children}</body>
    </html>
  )
}
