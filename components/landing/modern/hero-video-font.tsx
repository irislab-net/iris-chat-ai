const HELVETICA_NOW_VAR =
  "https://db.onlinewebfonts.com/c/e66905e07608167a84e6ad52f638c3c6?family=Helvetica+Now+Var"

export function HeroVideoFont() {
  return (
    <>
      <link rel="preconnect" href="https://db.onlinewebfonts.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={HELVETICA_NOW_VAR} />
    </>
  )
}
