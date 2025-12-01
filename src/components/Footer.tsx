export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-sm text-muted-foreground text-center space-y-2">
          <p className="leading-relaxed">
            <span className="font-medium text-foreground">© Future Molding</span> – Tutti i diritti riservati.
          </p>
          <p className="leading-relaxed">
            Engel, Arburg, KraussMaffei, Demag e gli altri marchi citati appartengono ai rispettivi proprietari.
          </p>
          <p className="leading-relaxed">
            Questa applicazione non è affiliata né approvata da tali aziende.
          </p>
          <p className="leading-relaxed">
            I valori e i calcoli sono solo a scopo informativo: l'impostazione delle presse rimane responsabilità esclusiva dell'operatore.
          </p>
        </div>
      </div>
    </footer>
  );
}

