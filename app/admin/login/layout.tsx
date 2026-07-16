// Dit bestand overschrijft de admin layout voor de login pagina
// zodat niet-ingelogde gebruikers niet geblokkeerd worden
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}