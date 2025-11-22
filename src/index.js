app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    version: "1.0"
  });
});

