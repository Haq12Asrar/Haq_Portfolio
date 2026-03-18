import "./globals.css";

export const metadata = {
  title: "Mohammad Asrar ul Haque Ahanger — Portfolio",
  description: "Building data-driven solutions and crafting efficient, user-friendly web applications.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
