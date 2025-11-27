const Footer = () => {
  return (
    <footer className="border-t border-border bg-gradient-card mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-3">
          <div className="text-4xl animate-paw-rotate">🐾</div>
          <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-gradient-to-r from-primary via-secondary to-accent rounded-full animate-pulse" />
          </div>
          <div className="text-4xl animate-paw-rotate" style={{ animationDelay: "1s" }}>🐾</div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          © 2024 Pet Care Log. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
