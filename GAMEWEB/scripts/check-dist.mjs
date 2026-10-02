import { readFile, readdir, access } from "node:fs/promises";
import { resolve, relative } from "node:path";
import assert from "node:assert/strict";

const dist = resolve("dist");
const html = await readFile(resolve(dist, "index.html"), "utf8");
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
  (match) => match[1],
);
assert.ok(
  references.some((path) => path.endsWith(".js")),
  "JavaScript não encontrado",
);
assert.ok(
  references.some((path) => path.endsWith(".css")),
  "CSS não encontrado",
);
assert.ok(references.includes("/favicon.svg"), "Favicon não encontrado");
for (const reference of references) {
  assert.ok(
    reference.startsWith("/") && !reference.startsWith("//"),
    `Asset externo: ${reference}`,
  );
  const file = resolve(dist, `.${reference}`);
  assert.ok(!relative(dist, file).startsWith(".."), "Asset fora do dist");
  await access(file);
}
const headers = await readFile(resolve(dist, "_headers"), "utf8");
assert.ok(headers.includes("X-Content-Type-Options: nosniff"));
assert.ok(
  !(await readdir(dist)).includes("404.html"),
  "404.html desativa o fallback SPA nativo do Pages",
);
for (const name of await readdir(resolve(dist, "assets"))) {
  assert.ok(!name.endsWith(".map"), "Source map público inesperado");
  if (!/\.(js|css)$/.test(name)) continue;
  const content = await readFile(resolve(dist, "assets", name), "utf8");
  assert.ok(
    !/\b[A-Z]:[\\/](?!\/)|file:\/\/|https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(
      content,
    ),
    `Caminho local em ${name}`,
  );
}
console.log(
  `dist validado: index.html, ${references.length} assets referenciados, headers e fallback SPA nativo.`,
);
